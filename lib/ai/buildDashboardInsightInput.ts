import type { DashboardInsightInput } from "@/lib/ai/generateDashboardInsight";
import type { SyncSummaryDoc } from "@/lib/firestore/saveSyncSummary";


export function buildDashboardInsightInput(
  summary: SyncSummaryDoc | null
): DashboardInsightInput {
  if (!summary) {
    return {};
  }

  return {
    businessSources: summary.businessSources ?? [],

    sales: summary.signals.sales
      ? {
          revenue: summary.signals.sales.revenue ?? null,
          orderCount: summary.signals.sales.orderCount ?? null,
          currency: summary.signals.sales.currency ?? null,
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

  crm: summary.signals.crm
    ? {
        leads: summary.signals.crm.leads ?? null,
        opportunities: summary.signals.crm.opportunities ?? null,
      }
    : undefined,

  finance: summary.signals.finance
    ? {
        amount: summary.signals.finance.amount ?? null,
        currency: summary.signals.finance.currency ?? null,
      }
    : undefined,

  socialMedia: summary.signals.socialMedia
    ? {
        reach: summary.signals.socialMedia.reach ?? null,
        engagement: summary.signals.socialMedia.engagement ?? null,
      }
    : undefined,

  booking: summary.signals.booking
    ? {
        reservations: summary.signals.booking.reservations ?? null,
        appointments: summary.signals.booking.appointments ?? null,
      }
    : undefined,

  downtime: summary.signals.downtime
    ? {
        minutes: summary.signals.downtime.minutes ?? null,
      }
    : undefined,
};
}