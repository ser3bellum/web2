import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { findNangoConnectionId } from "@/lib/nango/findConnectionId";
import { getNango } from "@/lib/nango/server";
import { getUserCompanyContext } from "@/lib/data/getUserCompanyContext";
import { adminAuth } from "@/lib/firebase/admin";
import type { AnalyticsModalPayload } from "@/lib/analytics/types";

export const dynamic = "force-dynamic";

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

function formatRangeLabel(from: string, to: string) {
  const fmt = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  });

  return `${fmt.format(parseYyyyMmDd(from))} – ${fmt.format(parseYyyyMmDd(to))}`;
}

function safeNumber(value: string | undefined) {
  const n = Number(value ?? "0");
  return Number.isFinite(n) ? n : 0;
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

  const accountName: string | undefined =
    accountsRes?.data?.accounts?.[0]?.name;

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

async function runGaModalSummaryReport(params: {
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
      ],
    },
  });

  const row = res?.data?.rows?.[0];

  return {
    users: safeNumber(row?.metricValues?.[0]?.value),
    sessions: safeNumber(row?.metricValues?.[1]?.value),
    newUsers: safeNumber(row?.metricValues?.[2]?.value),
  };
}

async function runGaTopPageReport(params: {
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
      dimensions: [{ name: "pageLocation" }],
      metrics: [{ name: "screenPageViews" }],
      orderBys: [
        {
          metric: {
            metricName: "screenPageViews",
          },
          desc: true,
        },
      ],
      limit: 1,
    },
  });

  const row = res?.data?.rows?.[0];

  return {
    pageLocation: row?.dimensionValues?.[0]?.value || "",
    views: safeNumber(row?.metricValues?.[0]?.value),
  };
}

async function runGaTopLocationsReport(params: {
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
      dimensions: [{ name: "country" }],
      metrics: [{ name: "activeUsers" }],
      orderBys: [
        {
          metric: {
            metricName: "activeUsers",
          },
          desc: true,
        },
      ],
      limit: 5,
    },
  });

  const rows = Array.isArray(res?.data?.rows) ? res.data.rows : [];

  return rows.map((row: any) => ({
    country: row?.dimensionValues?.[0]?.value || "Unknown",
    users: safeNumber(row?.metricValues?.[0]?.value),
  }));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const to = toYyyyMmDd(toParam ?? new Date());
    const from = toYyyyMmDd(
      fromParam ??
        (() => {
          const d = new Date();
          d.setDate(d.getDate() - 6);
          return d;
        })()
    );

    const { prevFrom, prevTo } = previousPeriod(from, to);

    const cookieStore = await cookies();
    const session = cookieStore.get("__Host-sb_auth")?.value;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      await adminAuth.verifySessionCookie(session, true);
    } catch (e) {
      console.error("ANALYTICS_MODAL_SESSION_REJECTED:", e);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user } = await getUserCompanyContext(session);

    if (!user?.id) {
      return NextResponse.json({ error: "Missing user id" }, { status: 401 });
    }

    const providerConfigKey = "google-analytics";
    const connectionId = await findNangoConnectionId({
      providerConfigKey,
      endUserId: user.id,
    });

    if (!connectionId) {
      return NextResponse.json(
        { error: "No Google Analytics connection found" },
        { status: 404 }
      );
    }

    const propertyId = await getFirstGa4PropertyId({
      providerConfigKey,
      connectionId,
    });

    if (!propertyId) {
      return NextResponse.json(
        { error: "No GA4 property found" },
        { status: 404 }
      );
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("GA_MODAL_RUNREPORT_PAYLOAD:", {
        propertyId,
        from,
        to,
        prevFrom,
        prevTo,
      });
    }

    const [current, previous, topPage, topLocations] = await Promise.all([
      runGaModalSummaryReport({
        providerConfigKey,
        connectionId,
        propertyId,
        from,
        to,
      }),
      runGaModalSummaryReport({
        providerConfigKey,
        connectionId,
        propertyId,
        from: prevFrom,
        to: prevTo,
      }),
      runGaTopPageReport({
        providerConfigKey,
        connectionId,
        propertyId,
        from,
        to,
      }),
      runGaTopLocationsReport({
        providerConfigKey,
        connectionId,
        propertyId,
        from,
        to,
      }),
    ]);

    const payload: AnalyticsModalPayload = {
      users: current.users,
      sessions: current.sessions,
      newUsers: current.newUsers,
      topPage: topPage.pageLocation || "—",
      topLocations,
      selectedRangeLabel: formatRangeLabel(from, to),
      previousRangeLabel: formatRangeLabel(prevFrom, prevTo),
      comparison: {
        users: {
          current: current.users,
          previous: previous.users,
        },
        sessions: {
          current: current.sessions,
          previous: previous.sessions,
        },
      },
    };

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error(
      "ANALYTICS_MODAL_ROUTE_ERROR:",
      error?.response?.data || error?.message || error
    );

    return NextResponse.json(
      {
        error: "Failed to load analytics modal data",
        details: error?.response?.data ?? error?.message ?? "unknown",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}