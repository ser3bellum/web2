import type { AIInsightPayload, AIInsightSeverity } from "@/types/ai";
import type { DashboardHydration } from "@/types/dashboard";

export type DashboardInsightInput = {

  businessSources?: DashboardHydration["businessSources"];

  sales?: {
    revenue?: number | null;
    orderCount?: number | null;
    currency?: string | null;
  };
  analytics?: {
    sessions?: number | null;
  };
  marketing?: {
    traffic?: number | null;
    delta?: string | null;
  };
  crm?: {
    leads?: number | null;
    opportunities?: number | null;
  };
  finance?: {
    amount?: number | null;
    currency?: string | null;
  };
  socialMedia?: {
    reach?: number | null;
    engagement?: number | null;
  };
  booking?: {
    reservations?: number | null;
    appointments?: number | null;
  };
  downtime?: {
    minutes?: number | null;
  };
};

function hasMeaningfulData(input: DashboardInsightInput): boolean {
  return [
    input.sales?.revenue,
    input.sales?.orderCount,
    input.analytics?.sessions,
    input.marketing?.traffic,
    input.crm?.leads,
    input.crm?.opportunities,
    input.finance?.amount,
    input.socialMedia?.reach,
    input.socialMedia?.engagement,
    input.booking?.reservations,
    input.booking?.appointments,
    input.downtime?.minutes,
  ].some((value) => value != null);
}

function buildReadyInsight(
  headline: string,
  whyItMatters: string,
  recommendedAction: string,
  sourceNote: string,
  severity: AIInsightSeverity
): AIInsightPayload {
  return {
    status: "ready",
    headline,
    whyItMatters,
    recommendedAction,
    sourceNote,
    severity,
    generatedAt: new Date().toISOString(),
  };
}

export function generateDashboardInsight(
  input: DashboardInsightInput
): AIInsightPayload {
  const revenue = input.sales?.revenue ?? null;
  const orders = input.sales?.orderCount ?? null;
  const sessions = input.analytics?.sessions ?? null;
  const traffic = input.marketing?.traffic ?? null;
  const downtime = input.downtime?.minutes ?? null;


  if (!hasMeaningfulData(input)) {
    return {
      status: "empty",
      headline: "",
      whyItMatters: "",
      recommendedAction: "",
      sourceNote: "",
    };
  }

  if (downtime !== null && downtime >= 10) {
    return buildReadyInsight(
      `Downtime reached ${downtime} minutes during the selected period.`,
      "Service interruptions may affect customer trust and reduce conversion opportunities.",
      "Review the affected service checks and compare them with recent incidents or infrastructure changes.",
      "Based on downtime metrics captured during the selected date range.",
      "high"
    );
  }

  if (revenue !== null && revenue > 0 && orders !== null && orders > 0 && sessions === 0) {
    return buildReadyInsight(
      "Sales activity was detected while analytics sessions remained flat.",
      "This may indicate a tracking gap, attribution inconsistency, or conversions coming from traffic sources not fully captured in analytics.",
      "Check analytics tagging and compare order timestamps with campaign and traffic source data.",
      "Based on revenue, order count, and analytics session summaries.",
      "medium"
    );
  }

  if (traffic !== null && traffic >= 1000) {
    return buildReadyInsight(
      `Marketing traffic reached ${traffic.toLocaleString()} during the selected period.`,
      "Higher traffic can signal campaign momentum, but it should be reviewed alongside conversion quality.",
      "Compare traffic sources with sales and conversion trends to identify the strongest-performing channels.",
      "Based on marketing traffic and related dashboard activity.",
      "low"
    );
  }

  return buildReadyInsight(
    "Connected sources are reporting stable activity across the selected period.",
    "A stable baseline makes future anomalies easier to detect as more connector data becomes available.",
    "Continue monitoring current sources and connect additional providers for richer cross-signal insights.",
    "Based on currently connected dashboard summaries.",
    "low"
  );
}