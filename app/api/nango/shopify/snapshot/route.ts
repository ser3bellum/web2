import { NextResponse } from "next/server";
import { getNango } from "@/lib/nango/server";
import { findNangoConnectionId } from "@/lib/nango/findConnectionId";
import { buildShopifySnapshot, ShopifyOrder } from "@/lib/integrations/shopify/normalize";

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
      providerConfigKey: "shopify",
      endUserId
    });

    const result = await nango.get({
      providerConfigKey: "shopify",
      connectionId,
      endpoint: "/admin/api/2026-04/orders.json?status=any&limit=50"
    });

    const orders = ((result?.data?.orders ?? []) as ShopifyOrder[]);

    const snapshot = buildShopifySnapshot(orders);

    return NextResponse.json({
      success: true,
      connectionId,
      snapshot
    });
  } catch (err: any) {
    console.error("Shopify snapshot error", err?.response?.data || err);

    return NextResponse.json(
      {
        error: "Failed to build Shopify snapshot",
        details: err?.message ?? "Unknown error"
      },
      { status: 500 }
    );
  }
}