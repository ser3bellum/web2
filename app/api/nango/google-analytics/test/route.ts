import { NextResponse } from "next/server";
import { getNango } from "@/lib/nango/server";
import { findNangoConnectionId } from "@/lib/nango/findConnectionId";

export async function GET() {
  try {
    const nango = getNango();

    const providerConfigKey = "google-analytics"; // ✅ must match Nango integration ID
    const endUserId = "nicoletshumba@ser3bellum.com"; // keep for now, but see section B

    const connectionId = await findNangoConnectionId({
      providerConfigKey,
      endUserId,
    });

    const result = await nango.get({
      endpoint: "/v1beta/accounts",
      params: { pageSize: 10 },
      providerConfigKey,
      connectionId,
      baseUrlOverride: "https://analyticsadmin.googleapis.com",
    });

    return NextResponse.json(result.data);
  } catch (err: any) {
    console.error("GA test error", err?.response?.data || err);
    return NextResponse.json(
      { error: "Failed GA test", details: err?.message, raw: err?.response?.data },
      { status: 500 }
    );
  }
}