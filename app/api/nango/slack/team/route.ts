import { NextResponse } from "next/server";
import { getNango } from "@/lib/nango/server";
import { findNangoConnectionId } from "@/lib/nango/findConnectionId";

export async function GET() {
  try {
    const nango = getNango();

    const connectionId = await findNangoConnectionId({
      providerConfigKey: "slack",
      endUserId: "dev-user-1",
    });

    const result = await nango.get({
      providerConfigKey: "slack",
      connectionId,
      endpoint: "/team.info", // ✅ IMPORTANT: no "/api" prefix
    });

    return NextResponse.json(result.data);
  } catch (err: any) {
    console.error("Slack team error", err?.response?.data || err);
    return NextResponse.json(
      { error: "Failed to fetch Slack team", details: err?.message },
      { status: 500 }
    );
  }
}