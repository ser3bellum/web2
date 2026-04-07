export type ShopifyOrder = {
  id: number | string;
  fulfillment_status?: string | null;
  financial_status?: string | null;
  created_at?: string;
  total_price?: string;
  currency?: string;
};

export type ShopifyOperationalSnapshot = {
  source: "shopify";
  snapshotType: "operations";
  metrics: {
    totalOrders: number;
    pendingFulfillments: number;
    paidOrders: number;
    unpaidOrders: number;
    totalRevenue: number;
    currency: string | null;
  };
  generatedAt: string;
};

export function buildShopifySnapshot(
  orders: ShopifyOrder[]
): ShopifyOperationalSnapshot {
  const totalOrders = orders.length;

  const pendingFulfillments = orders.filter(
    (order) => order.fulfillment_status !== "fulfilled"
  ).length;

  const paidOrders = orders.filter(
    (order) => order.financial_status === "paid"
  ).length;

  const unpaidOrders = totalOrders - paidOrders;

  const totalRevenue = orders.reduce((sum, order) => {
    const amount = Number(order.total_price ?? 0);
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);

  const currency =
    orders.find((order) => order.currency)?.currency ?? null;

  return {
    source: "shopify",
    snapshotType: "operations",
    metrics: {
      totalOrders,
      pendingFulfillments,
      paidOrders,
      unpaidOrders,
      totalRevenue,
      currency
    },
    generatedAt: new Date().toISOString()
  };
}