export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { connectionId, providerConfigKey } = body;

    if (!connectionId || !providerConfigKey) {
      return NextResponse.json(
        { error: "Missing connectionId or providerConfigKey" },
        { status: 400 }
      );
    }
    const nangoSecretKey = process.env.NANGO_SECRET_KEY;

    if (!nangoSecretKey) {
    return NextResponse.json(
    { error: "Missing NANGO_SECRET_KEY" },
    { status: 500 }
  );
}
    const response = await fetch(
      `https://api.nango.dev/connections/${connectionId}?provider_config_key=${providerConfigKey}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${nangoSecretKey}`,
        },
      }
    );
    console.log("Disconnect request:", {
    connectionId,
    providerConfigKey,
    hasNangoSecretKey: Boolean(nangoSecretKey),
    });

    if (!response.ok) {
      const text = await response.text();

      return NextResponse.json(
        {
          error: "Failed to delete Nango connection",
          details: text,
        },
        { status: response.status }
      );
      console.error("Nango disconnect failed:", {
    status: response.status,
    body: text,
});
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
  

}