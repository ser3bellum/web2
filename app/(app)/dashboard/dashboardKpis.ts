import type { DashboardRange } from "@/app/(app)/lib/dateRange";
import type { DashboardHydration } from "./getDashboardHydration";

export type DashboardKpi = {
  id: string;
  title: string;
  value: string;
  subtitle?: string;
  delta?: {
    value: string;
    tone?: "up" | "down" | "neutral";
  };
  meta?: Record<string, any>;
};

function toneFromDelta(delta?: string): "up" | "down" | "neutral" {
  if (!delta) return "neutral";
  if (delta.startsWith("-")) return "down";
  if (delta.startsWith("+")) return "up";
  return "neutral";
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function formatCurrency(
  amount: number,
  currency: string,
  locale = "fr-FR"
): string {
  const safeCurrency =
    typeof currency === "string" && currency.trim().length === 3
      ? currency.toUpperCase()
      : "EUR";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: safeCurrency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(amount);
  }
}

export async function getDashboardKpis(params: {
  companyId: string;
  range: DashboardRange;
  hydration?: DashboardHydration | null;
}): Promise<DashboardKpi[]> {
  const { hydration } = params;

  const gaOverview = hydration?.cards?.find((card) => card.key === "ga_overview");
  const salesCard = hydration?.cards?.find((card) => card.key === "sales");

  const analyticsValue =
    gaOverview?.status === "ok"
      ? gaOverview.value.replace(/\s+sessions?$/i, "")
      : "—";

  const analyticsDelta = gaOverview?.delta;

  const salesRevenue = toNumber(
    salesCard?.meta?.currentRevenue ??
      salesCard?.meta?.revenue ??
      salesCard?.meta?.amount
  );

  const salesCurrency =
    typeof salesCard?.meta?.currency === "string" &&
    salesCard.meta.currency.trim().length === 3
      ? salesCard.meta.currency.toUpperCase()
      : "EUR";

  const salesSeries = Array.isArray(salesCard?.meta?.series)
    ? salesCard.meta.series
    : [];

  const salesValue =
    salesRevenue !== null
      ? formatCurrency(salesRevenue, salesCurrency)
      : salesCard?.value?.trim() || "—";

const currentRevenueValue = salesRevenue ?? 0;
const previousRevenueValue =
  toNumber(salesCard?.meta?.previousRevenue) ?? 0;

const currentOrderCount =
  toNumber(salesCard?.meta?.orderCount) ?? 0;

const previousOrderCount =
  toNumber(salesCard?.meta?.previousOrderCount) ?? 0;

const averageOrderValue =
  currentOrderCount > 0 ? currentRevenueValue / currentOrderCount : 0;

  const salesDelta = salesCard?.delta;

  return [
    {
      id: "kpi-analytics",
      title: "Analytics",
      value: analyticsValue,
      subtitle: "Visitors",
      delta: analyticsDelta
        ? {
            value: analyticsDelta,
            tone: toneFromDelta(analyticsDelta),
          }
        : undefined,
    },
    {
      id: "kpi-sales",
      title: "Sales",
      value: salesValue,
      subtitle: "This month",
      delta: salesDelta
        ? {
            value: salesDelta,
            tone: toneFromDelta(salesDelta),
          }
        : undefined,
      meta: {
        currency: salesCurrency,
        series: salesSeries,
		orderCount: currentOrderCount,
  		previousOrderCount: previousOrderCount,
  		currentRevenue: currentRevenueValue,
  		previousRevenue: previousRevenueValue,
  		averageOrderValue,
      },
    },
    {
	id: "kpi-marketing",
	title: "Marketing",
	value: "—",
	subtitle: "Connect Meta Ads or Google Ads",
},
{
	id: "kpi-downtime",
	title: "Downtime",
	value: "—",
	subtitle: "Connect uptime monitoring",
},
{
	id: "kpi-cpu-usage",
	title: "CPU Usage",
	value: "—",
	subtitle: "Connect infrastructure monitoring",
},
  ];
}