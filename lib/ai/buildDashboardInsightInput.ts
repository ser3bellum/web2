import type { DashboardInsightInput } from "@/lib/ai/generateDashboardInsight";
import type { SyncSummaryDoc } from "@/lib/firestore/saveSyncSummary";

export function buildDashboardInsightInput(
  summary: SyncSummaryDoc | null
): DashboardInsightInput {
  if (!summary) {
    return {};
  }

  return {
    sales: summary.signals.sales
      ? {
          revenue: summary.signals.sales.revenue ?? null,
          orderCount: summary.signals.sales.orderCount ?? null,
        }
      : undefined,

    analytics: summary.signals.analytics
      ? {
          sessions: summary.signals.analytics.sessions ?? null,
        }
      : undefined,

    marketing: summary.signals.marketing
      ? {
          traffic: summary.signals.marketing.traffic ?? null,
          delta: summary.signals.marketing.delta ?? null,
        }
      : undefined,

    downtime: summary.signals.downtime
      ? {
          minutes: summary.signals.downtime.minutes ?? null,
        }
      : undefined,

    cpu: summary.signals.cpu
      ? {
          usage: summary.signals.cpu.usage ?? null,
        }
      : undefined,
  };
}