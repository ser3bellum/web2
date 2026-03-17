import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserCompanyContext } from "@/lib/data/getUserCompanyContext";
import { adminAuth } from "@/lib/firebase/admin";
import { findNangoConnectionId } from "@/lib/nango/findConnectionId";

export const dynamic = "force-dynamic";

type DashboardResponse = {
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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const cookieStore = await cookies();
  const session = cookieStore.get("__Host-sb_auth")?.value;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await adminAuth.verifySessionCookie(session, true);
  } catch (e) {
    console.error("DASHBOARD_ROUTE_SESSION_REJECTED:", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = await getUserCompanyContext(session);

  if (!user?.id) {
    return NextResponse.json({ error: "Missing user id" }, { status: 401 });
  }

  const endUserId = user.id;
  const providerConfigKey = "google-analytics";

  let gaConnected = false;
  let gaConnectionId: string | undefined;

  try {
    gaConnectionId = await findNangoConnectionId({
      providerConfigKey,
      endUserId,
    });
    gaConnected = Boolean(gaConnectionId);
  } catch {
    gaConnected = false;
  }

  const response: DashboardResponse = {
    range: { from, to },
    integrations: [
      {
        key: "google",
        providerConfigKey,
        connected: gaConnected,
        connectionId: gaConnectionId,
      },
    ],
    cards: [
      {
        key: "integrations",
        title: "Integrations",
        status: gaConnected ? "ok" : "disabled",
        value: gaConnected
          ? "Google Analytics connected"
          : "Connect Google Analytics",
      },
      {
        key: "ga_overview",
        title: "Traffic (GA4)",
        status: gaConnected ? "warn" : "disabled",
        value: gaConnected ? "Ready to fetch metrics" : "—",
        meta: { from, to },
      },
    ],
  };

  return NextResponse.json(response);
}
