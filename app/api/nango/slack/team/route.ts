import { NextResponse } from "next/server";
import { getNango } from "@/lib/nango/server";
import { findNangoConnectionId } from "@/lib/nango/findConnectionId";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const endUserId = body?.endUserId;

    if (!endUserId) {
      return NextResponse.json(
        { error: "Missing endUserId" },
        { status: 400 }
      );
    }

    const nango = getNango();

    const connectionId = await findNangoConnectionId({
      providerConfigKey: "slack",
      endUserId,
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
      {
        error: "Failed to fetch Slack team",
        details: err?.message,
      },
      { status: 500 }
    );
  }
}