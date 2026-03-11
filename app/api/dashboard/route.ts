import { NextResponse } from "next/server";
import { getNango } from "@/lib/nango/server";
import { findNangoConnectionId } from "@/lib/nango/findConnectionId";

// Optional: ensures this isn't cached in unexpected ways while you're iterating
export const dynamic = "force-dynamic";

type DashboardResponse = {
  range: { from: string; to: string };
  integrations: Array<{
    key: string;               // e.g. "google"
    providerConfigKey: string; // e.g. "google-analytics"
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

  // TODO: replace with real user id from auth (Firebase UID later)
  const endUserId = "test_nicole_tshumba";

  // IMPORTANT: this must match the Nango Integration ID you used in Connect
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

  // You can start hydrating the dashboard immediately with "connection-aware" UI
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