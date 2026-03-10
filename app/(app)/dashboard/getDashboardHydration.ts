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

  // 1) List GA accounts
  const accountsRes = await nango.get({
    endpoint: "/v1beta/accounts",
    params: { pageSize: 1 },
    providerConfigKey: params.providerConfigKey,
    connectionId: params.connectionId,
    baseUrlOverride: "https://analyticsadmin.googleapis.com",
  });

  const accountName: string | undefined =
    accountsRes?.data?.accounts?.[0]?.name;

  // accountName looks like "accounts/123456"
  if (!accountName) return undefined;

  // 2) List properties under that account (filter is required)
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

  // propName looks like "properties/123456"
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

  const valueStr: string | undefined =
    res?.data?.rows?.[0]?.metricValues?.[0]?.value;

  return {
    sessions: valueStr ? Number(valueStr) : 0,
  };
}

export async function getDashboardHydration(params: {
  from: string | Date;
  to: string | Date;
  endUserId: string;
}) {
  const from = toYyyyMmDd(params.from);
  const to = toYyyyMmDd(params.to);
  const endUserId = params.endUserId;

  const providerConfigKey = "google-analytics";

  let connected = false;
  let connectionId: string | undefined;

  try {
    connectionId = await findNangoConnectionId({
      providerConfigKey,
      endUserId,
    });
    connected = Boolean(connectionId);
  } catch {
    connected = false;
  }

  let gaStatus: "ok" | "warn" | "error" | "disabled" = connected
    ? "warn"
    : "disabled";
  let gaValue = connected ? "Ready to fetch metrics" : "—";
  let gaDelta: string | undefined;
  let gaMeta: Record<string, any> = { from, to };

  if (connected && connectionId) {
    try {
      const propertyId = await getFirstGa4PropertyId({
        providerConfigKey,
        connectionId,
      });

      if (!propertyId) {
        gaStatus = "warn";
        gaValue = "No GA4 property found";
      } else {
        const { prevFrom, prevTo } = previousPeriod(from, to);

        const [current, prev] = await Promise.all([
          runGaReport({
            providerConfigKey,
            connectionId,
            propertyId,
            from,
            to,
          }),
          runGaReport({
            providerConfigKey,
            connectionId,
            propertyId,
            from: prevFrom,
            to: prevTo,
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
        };
      }
    } catch (e: any) {
      console.error(
        "GA_FETCH_FAILED:",
        e?.response?.data || e?.message || e
      );

      gaStatus = "error";
      gaValue = "GA fetch failed";
      gaMeta = {
        ...gaMeta,
        error: e?.response?.data ?? e?.message ?? "unknown",
      };
    }
  }

  const hydration: DashboardHydration = {
    range: { from, to },
    integrations: [
      {
        key: "google",
        providerConfigKey,
        connected,
        connectionId,
      },
    ],
    cards: [
      {
        key: "integrations",
        title: "Integrations",
        status: connected ? "ok" : "disabled",
        value: connected
          ? "Google Analytics connected"
          : "Connect Google Analytics",
      },
      {
        key: "ga_overview",
        title: "Traffic (GA4)",
        status: gaStatus,
        value: gaValue,
        delta: gaDelta,
        meta: gaMeta,
      },
    ],
  };

  return hydration;
}