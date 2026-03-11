import { NextResponse } from "next/server";
import { getNango } from "@/lib/nango/server";
import { findNangoConnectionId } from "@/lib/nango/findConnectionId";

export async function GET() {
  return NextResponse.json({
    debug: true,
    nangoEnv: process.env.NANGO_ENV ?? null,
    hasSecret: !!process.env.NANGO_SECRET_KEY,
    providerConfigKey: process.env.NANGO_SLACK_PROVIDER_CONFIG_KEY ?? null,
  });

  try {
    const nango = getNango();

    const connectionId = await findNangoConnectionId({
      providerConfigKey: "slack",
      endUserId: "test_nicole_tshumba",
    });

    const result = await nango.get({
      providerConfigKey: "slack",
      connectionId,
      endpoint: "/team.info",
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