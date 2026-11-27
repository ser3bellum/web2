import type { DashboardRange } from "@/app/(app)/lib/dateRange";
import type {
  DashboardHydration,
  DashboardKpi,
} from "@/types/dashboard";

export type { DashboardKpi } from "@/types/dashboard";

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
  locale = "fr-FR",
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
  const crmCard = hydration?.cards?.find((card) => card.key === "crm");

  const analyticsValue =
    gaOverview?.status === "ok"
      ? gaOverview.value.replace(/\s+sessions?$/i, "")
      : "—";
  const analyticsDelta = gaOverview?.delta;

  const salesRevenue = toNumber(
    salesCard?.meta?.currentRevenue ??
      salesCard?.meta?.revenue ??
      salesCard?.meta?.amount,
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
  const previousRevenueValue = toNumber(salesCard?.meta?.previousRevenue) ?? 0;
  const currentOrderCount = toNumber(salesCard?.meta?.orderCount) ?? 0;
  const previousOrderCount = toNumber(salesCard?.meta?.previousOrderCount) ?? 0;
  const averageOrderValue =
    currentOrderCount > 0 ? currentRevenueValue / currentOrderCount : 0;
  const salesDelta = salesCard?.delta;

  // Read the same CRM payload as DashboardCardView. A zero is valid data;
  // missing or failed pipeline data must remain unavailable.
  const crmAvailable = Boolean(
    crmCard &&
      crmCard.status !== "disabled" &&
      crmCard.status !== "error" &&
      crmCard.meta?.pipelineStatus !== "error" &&
      crmCard.meta?.pipelineStatus !== "disabled",
  );
  const crmOpportunities = crmAvailable
    ? toNumber(crmCard?.meta?.opportunities)
    : null;

  const cardFor = (keys: string[]) => hydration?.cards?.find(
    (card) => keys.includes(card.key),
  );
  const buildMetricKpi = (config: {
    id: DashboardKpi["id"];
    title: string;
    subtitle: string;
    keys: string[];
    metric: string;
    format?: "number" | "currency" | "minutes";
  }): DashboardKpi => {
    const card = cardFor(config.keys);
    const available = Boolean(card && card.status === "ok");
    const number = available ? toNumber(card?.meta?.[config.metric]) : null;
    const currency = typeof card?.meta?.currency === "string"
      ? card.meta.currency : null;
    const hasValue = number !== null &&
      (config.format !== "currency" || currency !== null);
    const value = !hasValue ? "—"
      : config.format === "currency" ? formatCurrency(number!, currency!)
      : config.format === "minutes" ? `${number!.toLocaleString("fr-FR")} min`
      : number!.toLocaleString("fr-FR");
    return {
      id: config.id,
      title: config.title,
      subtitle: config.subtitle,
      value,
      isPlaceholder: !hasValue,
      delta: available && card?.delta
        ? { value: card.delta, tone: toneFromDelta(card.delta) }
        : undefined,
      meta: {
        ...(card?.meta ?? {}),
        dataStatus: hasValue ? "ready" : card?.status ?? "unavailable",
      },
    };
  };

  return [
    {
      id: "kpi-analytics",
      title: "Analytics",
      value: analyticsValue,
      isPlaceholder: gaOverview?.status !== "ok",
      subtitle: "Visitors",
      delta: analyticsDelta
        ? { value: analyticsDelta, tone: toneFromDelta(analyticsDelta) }
        : undefined,
    },
    {
      id: "kpi-sales",
      title: "Sales",
      value: salesCard?.status === "ok" ? salesValue : "—",
      isPlaceholder: salesCard?.status !== "ok",
      subtitle: "This month",
      delta: salesDelta
        ? { value: salesDelta, tone: toneFromDelta(salesDelta) }
        : undefined,
      meta: {
        currency: salesCurrency,
        series: salesSeries,
        orderCount: currentOrderCount,
        previousOrderCount,
        currentRevenue: currentRevenueValue,
        previousRevenue: previousRevenueValue,
        averageOrderValue,
      },
    },
    {
      id: "kpi-crm",
      title: "CRM / Pipeline",
      value: crmOpportunities !== null
        ? crmOpportunities.toLocaleString("fr-FR")
        : "—",
      subtitle: "Open opportunities",
      isPlaceholder: crmOpportunities === null,
      meta: {
        ...crmCard?.meta,
        pipelineValue: crmAvailable
          ? toNumber(crmCard?.meta?.pipelineValue) : null,
        opportunities: crmOpportunities,
        qualifiedLeads: crmAvailable
          ? toNumber(crmCard?.meta?.qualifiedLeads) : null,
        winRate: crmAvailable ? toNumber(crmCard?.meta?.winRate) : null,
        stages: crmAvailable && Array.isArray(crmCard?.meta?.stages)
          ? crmCard.meta.stages : [],
      },
    },
    buildMetricKpi({
      id: "kpi-finance",
      title: "Finance",
      subtitle: "Net activity",
      keys: ["accounting", "finance"],
      metric: "net",
      format: "currency",
    }),
    buildMetricKpi({
      id: "kpi-marketing",
      title: "Marketing",
      subtitle: "Conversions",
      keys: ["google_ads", "marketing"],
      metric: "conversions",
    }),
    buildMetricKpi({
      id: "kpi-social",
      title: "Social Media",
      subtitle: "Engagements",
      keys: ["meta_ads", "social"],
      metric: "engagements",
    }),
    buildMetricKpi({
      id: "kpi-booking",
      title: "Booking",
      subtitle: "Bookings",
      keys: ["booking"],
      metric: "totalBookings",
    }),
    buildMetricKpi({
      id: "kpi-downtime",
      title: "Downtime",
      subtitle: "Downtime",
      keys: ["downtime"],
      metric: "downtimeMinutes",
      format: "minutes",
    }),
  ];
}
