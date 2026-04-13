import { findNangoConnectionId } from "@/lib/nango/findConnectionId";
import { getNango } from "@/lib/nango/server";

export type DashboardHydration = {
  range: { from: string; to: string };
  integrations: Array<{
    key: string;
    providerConfigKey: string;
    connected: boolean;
    connectionId?: string;
  }>;
  cards: Array<{
    key: string;
    title: string;
    status: "ok" | "warn" | "error" | "disabled";
    value: string;
    delta?: string;
    meta?: Record<string, any>;
  }>;
};

type GaSeriesPoint = {
  t: number;
  label: string;
  value: number;
};

type SalesSeriesPoint = {
  t: number;
  label: string;
  value: number;
};

function toYyyyMmDd(input: string | Date) {
  if (typeof input === "string") return input;
  return input.toISOString().slice(0, 10);
}

function parseYyyyMmDd(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
}

function fmtYyyyMmDd(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatDayLabel(ts: number) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(ts);
}

function daysBetweenInclusive(from: string, to: string) {
  const a = parseYyyyMmDd(from);
  const b = parseYyyyMmDd(to);
  const ms = b.getTime() - a.getTime();
  const days = Math.floor(ms / (24 * 60 * 60 * 1000)) + 1;
  return Math.max(days, 1);
}

function previousPeriod(from: string, to: string) {
  const len = daysBetweenInclusive(from, to);
  const fromD = parseYyyyMmDd(from);
  const prevTo = new Date(fromD.getTime() - 24 * 60 * 60 * 1000);
  const prevFrom = new Date(
    prevTo.getTime() - (len - 1) * 24 * 60 * 60 * 1000
  );

  return {
    prevFrom: fmtYyyyMmDd(prevFrom),
    prevTo: fmtYyyyMmDd(prevTo),
  };
}

function formatInt(n: number) {
  return new Intl.NumberFormat("en-GB").format(Math.round(n));
}

function formatCurrency(n: number, currency = "EUR") {
  const safeCurrency =
    typeof currency === "string" && currency.trim().length === 3
      ? currency.toUpperCase()
      : "EUR";

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: safeCurrency,
    maximumFractionDigits: 0,
  }).format(n);
}

function pctDelta(current: number, prev: number) {
  if (!isFinite(prev) || prev <= 0) return undefined;
  const pct = ((current - prev) / prev) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(0)}%`;
}

async function getFirstGa4PropertyId(params: {
  providerConfigKey: string;
  connectionId: string;
}) {
  const nango = getNango();

  const accountsRes = await nango.get({
    endpoint: "/v1beta/accounts",
    params: { pageSize: 1 },
    providerConfigKey: params.providerConfigKey,
    connectionId: params.connectionId,
    baseUrlOverride: "https://analyticsadmin.googleapis.com",
  });

  const accountName: string | undefined = accountsRes?.data?.accounts?.[0]?.name;

  if (!accountName) return undefined;

  const propertiesRes = await nango.get({
    endpoint: "/v1beta/properties",
    params: {
      pageSize: 1,
      filter: `parent:${accountName}`,
    },
    providerConfigKey: params.providerConfigKey,
    connectionId: params.connectionId,
    baseUrlOverride: "https://analyticsadmin.googleapis.com",
  });

  const propName: string | undefined = propertiesRes?.data?.properties?.[0]?.name;

  return propName?.split("/")[1];
}

async function runGaReport(params: {
  providerConfigKey: string;
  connectionId: string;
  propertyId: string;
  from: string;
  to: string;
}) {
  if (process.env.NODE_ENV !== "production") {
    console.log("GA_RUNREPORT_PAYLOAD:", {
      propertyId: params.propertyId,
      from: params.from,
      to: params.to,
    });
  }

  const nango = getNango();

  const res = await nango.post({
    endpoint: `/v1beta/properties/${params.propertyId}:runReport`,
    providerConfigKey: params.providerConfigKey,
    connectionId: params.connectionId,
    baseUrlOverride: "https://analyticsdata.googleapis.com",
    data: {
      dateRanges: [{ startDate: params.from, endDate: params.to }],
      metrics: [{ name: "sessions" }],
    },
  });

  const valueStr: string | undefined = res?.data?.rows?.[0]?.metricValues?.[0]?.value;

  return {
    sessions: valueStr ? Number(valueStr) : 0,
  };
}

async function runGaDailySeriesReport(params: {
  providerConfigKey: string;
  connectionId: string;
  propertyId: string;
  from: string;
  to: string;
}) {
  const nango = getNango();

  const res = await nango.post({
    endpoint: `/v1beta/properties/${params.propertyId}:runReport`,
    providerConfigKey: params.providerConfigKey,
    connectionId: params.connectionId,
    baseUrlOverride: "https://analyticsdata.googleapis.com",
    data: {
      dateRanges: [{ startDate: params.from, endDate: params.to }],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "sessions" }],
      orderBys: [
        {
          dimension: {
            dimensionName: "date",
          },
        },
      ],
    },
  });

  const rows = Array.isArray(res?.data?.rows) ? res.data.rows : [];
  const valuesByDate = new Map<string, number>();

  for (const row of rows) {
    const dateValue: string | undefined = row?.dimensionValues?.[0]?.value;
    const metricValue: string | undefined = row?.metricValues?.[0]?.value;

    if (!dateValue) continue;
    valuesByDate.set(dateValue, metricValue ? Number(metricValue) : 0);
  }

  const series: GaSeriesPoint[] = [];
  const start = parseYyyyMmDd(params.from);
  const end = parseYyyyMmDd(params.to);

  for (
    let cursor = new Date(start);
    cursor.getTime() <= end.getTime();
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    const yyyy = cursor.getUTCFullYear();
    const mm = String(cursor.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(cursor.getUTCDate()).padStart(2, "0");
    const gaDateKey = `${yyyy}${mm}${dd}`;
    const t = cursor.getTime();

    series.push({
      t,
      label: formatDayLabel(t),
      value: valuesByDate.get(gaDateKey) ?? 0,
    });
  }

  return series;
}

async function getShopifyOrders(params: {
  providerConfigKey: string;
  connectionId: string;
  from: string;
  to: string;
}) {
  const nango = getNango();

  const res = await nango.get({
    endpoint: "/admin/api/2025-01/orders.json",
    providerConfigKey: params.providerConfigKey,
    connectionId: params.connectionId,
    params: {
      status: "any",
      limit: 250,
      created_at_min: `${params.from}T00:00:00Z`,
      created_at_max: `${params.to}T23:59:59Z`,
      fields:
        "id,created_at,current_total_price,total_price,currency,financial_status,cancelled_at",
    },
  });

  return Array.isArray(res?.data?.orders) ? res.data.orders : [];
}

function sumShopifyOrdersRevenue(orders: any[]) {
  return orders.reduce((sum, order) => {
    if (order?.cancelled_at) return sum;

    const value =
      Number(order?.current_total_price ?? order?.total_price ?? 0) || 0;

    return sum + value;
  }, 0);
}

function buildShopifySalesSeries(params: {
  orders: any[];
  from: string;
  to: string;
}): SalesSeriesPoint[] {
  const valuesByDate = new Map<string, number>();

  for (const order of params.orders) {
    if (order?.cancelled_at) continue;

    const createdAt = order?.created_at;
    if (!createdAt) continue;

    const dateKey = String(createdAt).slice(0, 10);

    const value =
      Number(order?.current_total_price ?? order?.total_price ?? 0) || 0;

    valuesByDate.set(dateKey, (valuesByDate.get(dateKey) ?? 0) + value);
  }

  const series: SalesSeriesPoint[] = [];
  const start = parseYyyyMmDd(params.from);
  const end = parseYyyyMmDd(params.to);

  for (
    let cursor = new Date(start);
    cursor.getTime() <= end.getTime();
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    const dateKey = fmtYyyyMmDd(cursor);
    const t = cursor.getTime();

    series.push({
      t,
      label: formatDayLabel(t),
      value: valuesByDate.get(dateKey) ?? 0,
    });
  }

  return series;
}

export async function getDashboardHydration(params: {
  from: string | Date;
  to: string | Date;
  endUserId: string;
}) {
  const from = toYyyyMmDd(params.from);
  const to = toYyyyMmDd(params.to);
  const endUserId = params.endUserId;

  const gaProviderConfigKey = "google-analytics";
  const shopifyProviderConfigKey = "shopify";

  let gaConnected = false;
  let gaConnectionId: string | undefined;

  try {
    gaConnectionId = await findNangoConnectionId({
      providerConfigKey: gaProviderConfigKey,
      endUserId,
    });
    gaConnected = Boolean(gaConnectionId);
  } catch {
    gaConnected = false;
  }

  let shopifyConnected = false;
  let shopifyConnectionId: string | undefined;

  try {
    shopifyConnectionId = await findNangoConnectionId({
      providerConfigKey: shopifyProviderConfigKey,
      endUserId,
    });
    shopifyConnected = Boolean(shopifyConnectionId);
  } catch {
    shopifyConnected = false;
  }

  let gaStatus: "ok" | "warn" | "error" | "disabled" = gaConnected
    ? "warn"
    : "disabled";
  let gaValue = gaConnected ? "Ready to fetch metrics" : "—";
  let gaDelta: string | undefined;
  let gaMeta: Record<string, any> = { from, to, series: [] };

  if (gaConnected && gaConnectionId) {
    try {
      const propertyId = await getFirstGa4PropertyId({
        providerConfigKey: gaProviderConfigKey,
        connectionId: gaConnectionId,
      });

      if (!propertyId) {
        gaStatus = "warn";
        gaValue = "No GA4 property found";
      } else {
        const { prevFrom, prevTo } = previousPeriod(from, to);

        const [current, prev, series] = await Promise.all([
          runGaReport({
            providerConfigKey: gaProviderConfigKey,
            connectionId: gaConnectionId,
            propertyId,
            from,
            to,
          }),
          runGaReport({
            providerConfigKey: gaProviderConfigKey,
            connectionId: gaConnectionId,
            propertyId,
            from: prevFrom,
            to: prevTo,
          }),
          runGaDailySeriesReport({
            providerConfigKey: gaProviderConfigKey,
            connectionId: gaConnectionId,
            propertyId,
            from,
            to,
          }),
        ]);

        gaStatus = "ok";
        gaValue = `${formatInt(current.sessions)} sessions`;
        gaDelta = pctDelta(current.sessions, prev.sessions);
        gaMeta = {
          ...gaMeta,
          propertyId,
          prevFrom,
          prevTo,
          series,
        };
      }
    } catch (e: any) {
      console.error("GA_FETCH_FAILED:", e?.response?.data || e?.message || e);

      gaStatus = "error";
      gaValue = "GA fetch failed";
      gaMeta = {
        ...gaMeta,
        error: e?.response?.data ?? e?.message ?? "unknown",
        series: [],
      };
    }
  }

  let salesStatus: "ok" | "warn" | "error" | "disabled" = shopifyConnected
    ? "warn"
    : "disabled";
  let salesValue = shopifyConnected ? "Ready to fetch sales" : "—";
  let salesDelta: string | undefined;
  let salesMeta: Record<string, any> = {
    from,
    to,
    provider: "shopify",
    series: [],
  };

  if (shopifyConnected && shopifyConnectionId) {
    try {
      const { prevFrom, prevTo } = previousPeriod(from, to);

      const [currentOrders, prevOrders] = await Promise.all([
        getShopifyOrders({
          providerConfigKey: shopifyProviderConfigKey,
          connectionId: shopifyConnectionId,
          from,
          to,
        }),
        getShopifyOrders({
          providerConfigKey: shopifyProviderConfigKey,
          connectionId: shopifyConnectionId,
          from: prevFrom,
          to: prevTo,
        }),
      ]);

      console.log("SHOPIFY_SALES_DEBUG", {
        endUserId,
        connectionId: shopifyConnectionId,
        from,
        to,
        prevFrom,
        prevTo,
        currentOrderCount: currentOrders.length,
        previousOrderCount: prevOrders.length,
        currentOrders,
        prevOrders,
      });

      const currentRevenue = sumShopifyOrdersRevenue(currentOrders);
      const prevRevenue = sumShopifyOrdersRevenue(prevOrders);

      const currency =
        currentOrders.find((order: any) => typeof order?.currency === "string")
          ?.currency ??
        prevOrders.find((order: any) => typeof order?.currency === "string")
          ?.currency ??
        "EUR";

      const series = buildShopifySalesSeries({
        orders: currentOrders,
        from,
        to,
      });

      salesStatus = "ok";
      salesValue = formatCurrency(currentRevenue, currency);
      salesDelta = pctDelta(currentRevenue, prevRevenue);
      salesMeta = {
        ...salesMeta,
        prevFrom,
        prevTo,
        currency,
        orderCount: currentOrders.length,
        previousOrderCount: prevOrders.length,
        currentRevenue,
        previousRevenue: prevRevenue,
        series,
      };
    } catch (e: any) {
      console.error(
        "SHOPIFY_SALES_FETCH_FAILED:",
        e?.response?.data || e?.message || e
      );

      salesStatus = "error";
      salesValue = "Shopify sales fetch failed";
      salesMeta = {
        ...salesMeta,
        error: e?.response?.data ?? e?.message ?? "unknown",
        series: [],
      };
    }
  }

  const hydration: DashboardHydration = {
    range: { from, to },
    integrations: [
      {
        key: "google",
        providerConfigKey: gaProviderConfigKey,
        connected: gaConnected,
        connectionId: gaConnectionId,
      },
      {
        key: "shopify",
        providerConfigKey: shopifyProviderConfigKey,
        connected: shopifyConnected,
        connectionId: shopifyConnectionId,
      },
    ],
    cards: [
      {
        key: "integrations",
        title: "Integrations",
        status: gaConnected || shopifyConnected ? "ok" : "disabled",
        value:
          gaConnected || shopifyConnected
            ? "Providers connected"
            : "Connect a provider",
      },
      {
        key: "ga_overview",
        title: "Traffic (GA4)",
        status: gaStatus,
        value: gaValue,
        delta: gaDelta,
        meta: gaMeta,
      },
      {
        key: "sales",
        title: "Sales",
        status: salesStatus,
        value: salesValue,
        delta: salesDelta,
        meta: salesMeta,
      },
    ],
  };

  return hydration;
}
