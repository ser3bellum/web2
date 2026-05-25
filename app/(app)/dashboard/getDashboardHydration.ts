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

type CardStatus = "ok" | "warn" | "error" | "disabled";

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

  const propName: string | undefined =
    propertiesRes?.data?.properties?.[0]?.name;

  return propName?.split("/")[1];
}

async function runGaReport(params: {
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
      metrics: [
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "newUsers" },
        { name: "screenPageViews" },
      ],
    },
  });

  const metricValues = res?.data?.rows?.[0]?.metricValues ?? [];

  return {
    users: Number(metricValues?.[0]?.value ?? 0),
    sessions: Number(metricValues?.[1]?.value ?? 0),
    newUsers: Number(metricValues?.[2]?.value ?? 0),
    views: Number(metricValues?.[3]?.value ?? 0),
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
      metrics: [{ name: "screenPageViews" }],
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
async function getStripeBalance(params: {
  providerConfigKey: string;
  connectionId: string;
}) {
  const nango = getNango();

  const res = await nango.get({
    endpoint: "/v1/balance",
    providerConfigKey: params.providerConfigKey,
    connectionId: params.connectionId,
    baseUrlOverride: "https://api.stripe.com",
  });

  return res?.data;
}

function sumStripeBalanceAmounts(items: any[]) {
  return items.reduce((sum, item) => {
    return sum + Number(item?.amount ?? 0) / 100;
  }, 0);
}
async function getStripeBalanceTransactions(params: {
  providerConfigKey: string;
  connectionId: string;
  from: string;
  to: string;
}) {
  const nango = getNango();

  const createdGte = Math.floor(parseYyyyMmDd(params.from).getTime() / 1000);
  const createdLte = Math.floor(
    new Date(`${params.to}T23:59:59Z`).getTime() / 1000
  );

  const res = await nango.get({
    endpoint: "/v1/balance_transactions",
    providerConfigKey: params.providerConfigKey,
    connectionId: params.connectionId,
    baseUrlOverride: "https://api.stripe.com",
    params: {
      limit: 100,
      "created[gte]": createdGte,
      "created[lte]": createdLte,
    },
  });

  return Array.isArray(res?.data?.data) ? res.data.data : [];
}

function sumStripeBalanceTransactions(transactions: any[]) {
  return transactions.reduce(
    (acc, tx) => {
      const amount = Number(tx?.amount ?? 0) / 100;
      const fee = Number(tx?.fee ?? 0) / 100;
      const net = Number(tx?.net ?? 0) / 100;

      acc.gross += amount;
      acc.fees += fee;
      acc.net += net;

      return acc;
    },
    { gross: 0, fees: 0, net: 0 }
  );
}

function buildStripeSalesSeries(params: {
  transactions: any[];
  from: string;
  to: string;
}): SalesSeriesPoint[] {
  const valuesByDate = new Map<string, number>();

  for (const tx of params.transactions) {
    if (tx?.type !== "charge") continue;

    const created = Number(tx?.created);
    if (!Number.isFinite(created)) continue;

    const dateKey = new Date(created * 1000).toISOString().slice(0, 10);
    const value = Number(tx?.amount ?? 0) / 100;

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
  const metaProviderConfigKey = "meta-marketing-api";
  const stripeProviderConfigKey = "stripe-api-key";
  const googleAdsProviderConfigKey = "google-ads";

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

  let googleAdsConnected = false;
  let googleAdsConnectionId: string | undefined;

  try {
  googleAdsConnectionId = await findNangoConnectionId({
    providerConfigKey: googleAdsProviderConfigKey,
    endUserId,
  });
  googleAdsConnected = Boolean(googleAdsConnectionId);
} catch {
  googleAdsConnected = false;
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

  let metaConnected = false;
  let metaConnectionId: string | undefined;

  try {
    metaConnectionId = await findNangoConnectionId({
      providerConfigKey: metaProviderConfigKey,
      endUserId,
    });
    metaConnected = Boolean(metaConnectionId);
  } catch {
    metaConnected = false;
  }

  let stripeConnected = false;
  let stripeConnectionId: string | undefined;

  try {
    stripeConnectionId = await findNangoConnectionId({
      providerConfigKey: stripeProviderConfigKey,
      endUserId,
    });
    stripeConnected = Boolean(stripeConnectionId);
  } catch {
    stripeConnected = false;
  }

  let gaStatus: CardStatus = gaConnected ? "warn" : "disabled";
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
      gaValue = `${formatInt(current.users)} users`;
      gaDelta = pctDelta(current.users, prev.users);
      gaMeta = {
       ...gaMeta,
      propertyId,
      prevFrom,
      prevTo,
      users: current.users,
      sessions: current.sessions,
      newUsers: current.newUsers,
      views: current.views,
      previousUsers: prev.users,
      previousSessions: prev.sessions,
      previousNewUsers: prev.newUsers,
      previousViews: prev.views,
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

  let salesStatus: CardStatus = shopifyConnected ? "warn" : "disabled";
  let salesValue = shopifyConnected ? "Ready to fetch sales" : "—";
  let salesDelta: string | undefined;
  let salesMeta: Record<string, any> = {
    from,
    to,
    provider: "shopify",
    sourceLabel: "Shopify orders",
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

  let stripeSalesStatus: CardStatus = stripeConnected ? "warn" : "disabled";
  let stripeSalesValue = stripeConnected ? "Ready to fetch payments" : "—";
  let stripeSalesDelta: string | undefined;
  let stripeSalesMeta: Record<string, any> = {
    from,
    to,
    provider: "stripe",
    sourceLabel: "Stripe payments",
    series: [],
  };

  let accountingStatus: CardStatus = stripeConnected ? "warn" : "disabled";
  let accountingValue = stripeConnected ? "Ready to fetch accounting" : "—";
  let accountingMeta: Record<string, any> = {
    from,
    to,
    provider: "stripe",
  };

  if (stripeConnected && stripeConnectionId) {
    try {
      const { prevFrom, prevTo } = previousPeriod(from, to);

      const [currentTxs, prevTxs, balance] = await Promise.all([
      getStripeBalanceTransactions({
      providerConfigKey: stripeProviderConfigKey,
      connectionId: stripeConnectionId,
      from,
      to,
      }),
      getStripeBalanceTransactions({
      providerConfigKey: stripeProviderConfigKey,
      connectionId: stripeConnectionId,
      from: prevFrom,
      to: prevTo,
      }),
      getStripeBalance({
      providerConfigKey: stripeProviderConfigKey,
      connectionId: stripeConnectionId,
      }),
    ]);

      console.log("STRIPE_SALES_DEBUG", {
        endUserId,
        connectionId: stripeConnectionId,
        from,
        to,
        prevFrom,
        prevTo,
        currentTransactionCount: currentTxs.length,
        previousTransactionCount: prevTxs.length,
      });

      const current = sumStripeBalanceTransactions(currentTxs);
      const previous = sumStripeBalanceTransactions(prevTxs);

      const currency =
        currentTxs
          .find((tx: any) => typeof tx?.currency === "string")
          ?.currency?.toUpperCase() ??
        prevTxs
          .find((tx: any) => typeof tx?.currency === "string")
          ?.currency?.toUpperCase() ??
        "EUR";

      const series = buildStripeSalesSeries({
        transactions: currentTxs,
        from,
        to,
      });

      stripeSalesStatus = "ok";
      stripeSalesValue = formatCurrency(current.gross, currency);
      stripeSalesDelta = pctDelta(current.gross, previous.gross);
      stripeSalesMeta = {
        ...stripeSalesMeta,
        prevFrom,
        prevTo,
        currency,
        currentRevenue: current.gross,
        previousRevenue: previous.gross,
        transactionCount: currentTxs.length,
        previousTransactionCount: prevTxs.length,
        fees: current.fees,
        net: current.net,
        series,
      };
      const pendingBalance = sumStripeBalanceAmounts(
      Array.isArray(balance?.pending) ? balance.pending : []
      );

      const availableBalance = sumStripeBalanceAmounts(
      Array.isArray(balance?.available) ? balance.available : []
      );

      accountingStatus = "ok";
      accountingValue = formatCurrency(pendingBalance + availableBalance, currency);
      accountingMeta = {
      ...accountingMeta,
      currency,
      gross: current.gross,
      fees: current.fees,
      net: current.net,
      pendingBalance,
      availableBalance,
      totalBalance: pendingBalance + availableBalance,
      transactionCount: currentTxs.length,
    };
    } catch (e: any) {
      console.error(
        "STRIPE_FETCH_FAILED:",
        e?.response?.data || e?.message || e
      );

      stripeSalesStatus = "error";
      stripeSalesValue = "Stripe fetch failed";
      stripeSalesMeta = {
        ...stripeSalesMeta,
        error: e?.response?.data ?? e?.message ?? "unknown",
        series: [],
      };

      accountingStatus = "error";
      accountingValue = "Stripe accounting fetch failed";
      accountingMeta = {
        ...accountingMeta,
        error: e?.response?.data ?? e?.message ?? "unknown",
      };
    }
  }
  const updatedAt = new Date().toISOString();
  const anyConnected =
    gaConnected || shopifyConnected || metaConnected || stripeConnected ||
  googleAdsConnected;

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
      key: "googleAds",
      providerConfigKey: googleAdsProviderConfigKey,
      connected: googleAdsConnected,
      connectionId: googleAdsConnectionId,
      },
      {
        key: "shopify",
        providerConfigKey: shopifyProviderConfigKey,
        connected: shopifyConnected,
        connectionId: shopifyConnectionId,
      },
      {
        key: "meta",
        providerConfigKey: metaProviderConfigKey,
        connected: metaConnected,
        connectionId: metaConnectionId,
      },
      {
        key: "stripe",
        providerConfigKey: stripeProviderConfigKey,
        connected: stripeConnected,
        connectionId: stripeConnectionId,
      },
    ],
    cards: [
      {
  key: "integrations",
  title: "Integrations",
  status: anyConnected ? "ok" : "disabled",
  value: anyConnected ? "Providers connected" : "Connect a provider",
  meta: {
    connectedIntegrations: [
      {
        key: "google",
        label: "Google Analytics",
        providerConfigKey: gaProviderConfigKey,
        connected: gaConnected,
        connectionId: gaConnectionId,
      },
      {
        key: "googleAds",
        label: "Google Ads",
        providerConfigKey: googleAdsProviderConfigKey,
        connected: googleAdsConnected,
        connectionId: googleAdsConnectionId,
      },
      {
        key: "shopify",
        label: "Shopify",
        providerConfigKey: shopifyProviderConfigKey,
        connected: shopifyConnected,
        connectionId: shopifyConnectionId,
      },
      {
        key: "meta",
        label: "Meta Marketing API",
        providerConfigKey: metaProviderConfigKey,
        connected: metaConnected,
        connectionId: metaConnectionId,
      },
      {
        key: "stripe",
        label: "Stripe",
        providerConfigKey: stripeProviderConfigKey,
        connected: stripeConnected,
        connectionId: stripeConnectionId,
      },
    ].filter((integration) => integration.connected),
  },
},
      {
        key: "ga_overview",
        title: "Traffic (GA4)",
        status: gaStatus,
        value: gaValue,
        delta: gaDelta,
        meta:{ ...gaMeta,
        updatedAt,
        },
      },
      {
         key: "sales",
          title: "Sales",
          status: salesStatus,
          value: salesValue,
          delta: salesDelta,
           meta: {
           ...salesMeta,
          updatedAt,
        },
      },
      {
        key: "stripe_sales",
          title: "Stripe Payments",
          status: stripeSalesStatus,
          value: stripeSalesValue,
          delta: stripeSalesDelta,
          meta: {
         ...stripeSalesMeta,
          updatedAt,
      },
      },
      {
        key: "accounting",
        title: "Accounting",
        status: accountingStatus,
        value: accountingValue,
        meta:{
          ...accountingMeta,
          updatedAt,
        } 
      },
      {
  key: "google_ads",
  title: "Marketing",
  status: googleAdsConnected ? "warn" : "disabled",
  value: googleAdsConnected ? "Google Ads connected" : "Connect Google Ads",
  delta: googleAdsConnected ? "Awaiting campaign data" : undefined,
  meta: {
    providerConfigKey: googleAdsProviderConfigKey,
    connectionId: googleAdsConnectionId,
    accessLevel: googleAdsConnected ? "oauth_connected" : "not_connected",
    from,
    to,
    updatedAt,
  },
},
{
  key: "meta_ads",
  title: "Social Network",
  status: metaConnected ? "warn" : "disabled",
  value: metaConnected ? "Basic OAuth connected" : "Connect Meta Ads",
  delta: metaConnected ? "Limited access" : undefined,
  meta: {
    providerConfigKey: metaProviderConfigKey,
    connectionId: metaConnectionId,
    accessLevel: metaConnected ? "basic_oauth" : "not_connected",
    from,
    to,
    updatedAt,
  },
    },
    ],
  };

  return hydration;
}
