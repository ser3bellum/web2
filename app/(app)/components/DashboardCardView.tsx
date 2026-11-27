"use client";

import type { Dictionary } from "@/lib/i18n/getDictionary";
import type { AIInsightPayload } from "@/types/ai";
import type { DashboardHydrationCard } from "@/types/dashboard";
import { AccountingBalanceBreakdown } from "./AccountingBalanceBreakdown";
import { AIInsightsCard } from "./AIInsightsCard";
import { AIInsightsReportCard } from "./AIInsightsReportCard";
import { SocialMediaChart } from "./SocialMediaChart";
import { AnalyticsMiniChart } from "./AnalyticsMiniChart";
import { Card } from "./Card";
import type {
  DashboardCardDef,
  DashboardCardId,
  DashboardCardSource,
} from "./DashboardCards";
import { SalesMiniBarChart } from "./SalesMiniBarChart";
import { MarketingConversionsChart } from "./MarketingConversionsChart";
import { CrmPipelineChart } from "./CrmPipelineChart";
import { BookingActivityChart } from "./BookingActivityChart";
import { DowntimeActivityChart } from "./DowntimeActivityChart";

type DashboardLabels = Dictionary["dashboard"];
type DashboardCardVariant = "dashboard" | "report";

type DashboardCardViewProps = {
  definition: DashboardCardDef;
  hydrationCards?: DashboardHydrationCard[];
  labels: DashboardLabels;
  aiInsight: AIInsightPayload;
  variant?: DashboardCardVariant;
};
type CrmContactPreview = {
  id: string;
  name: string;
  company: string | null;
  leadStatus: string | null;
};

function formatLeadStatus(status: string | null) {
  if (!status) return "Not recorded";

  const labels: Record<string, string> = {
    NEW: "New",
    OPEN: "Open",
    IN_PROGRESS: "In progress",
    OPEN_DEAL: "Open deal",
    UNQUALIFIED: "Unqualified",
    ATTEMPTED_TO_CONTACT: "Attempted to contact",
    CONNECTED: "Connected",
    BAD_TIMING: "Bad timing",
  };

  return Object.hasOwn(labels, status)
    ? labels[status]
    : status.replaceAll("_", " ");
}

function formatUpdatedLabel(updatedAt: string) {
  const updatedTime = new Date(updatedAt).getTime();

  if (Number.isNaN(updatedTime)) return "Updated just now";

  const diffMinutes = Math.floor(
    (Date.now() - updatedTime) / 60000,
  );

  if (diffMinutes < 1) return "Updated just now";
  if (diffMinutes < 60) return `Updated ${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Updated ${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `Updated ${diffDays}d ago`;
}

function formatCurrency(
  amount: number,
  currency: string,
  locale = "fr-FR",
): string {
  const safeCurrency =
    typeof currency === "string" &&
    currency.trim().length === 3
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

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function getHydratedSourcesForCard(
  cardId: DashboardCardId,
  hydrationCards?: DashboardHydrationCard[],
): DashboardCardSource[] | undefined {
  const integrationsCard = hydrationCards?.find(
    (card) => card.key === "integrations",
  );

  const connected = integrationsCard?.meta?.connectedIntegrations;

  if (!Array.isArray(connected)) return undefined;

  const has = (key: string) =>
    connected.some(
      (integration: { key?: string }) => integration.key === key,
    );

  if (cardId === "marketing") {
  const sources: DashboardCardSource[] = [];

  if (has("googleAds")) {
    sources.push({
      label: "Google Ads",
      variant: "success",
    });
  }

  if (has("meta")) {
    sources.push({
      label: "Meta Ads",
      variant: "success",
    });
  }

  if (has("brevo")) {
    sources.push({
      label: "Brevo",
      variant: "success",
    });
  }

  return sources.length ? sources : undefined;
}

  if (cardId === "social") {
    return has("meta")
      ? [{ label: "Meta Marketing API", variant: "warning" }]
      : undefined;
  }

  if (cardId === "analytics") {
    return has("google")
      ? [{ label: "Google Analytics", variant: "success" }]
      : undefined;
  }

  if (cardId === "sales") {
  const sources: DashboardCardSource[] = [];

  if (has("shopify")) {
    sources.push({
      label: "Shopify",
      variant: "success",
    });
  }

  if (has("woocommerce")) {
    sources.push({
      label: "WooCommerce",
      variant: "success",
    });
  }

  return sources.length ? sources : undefined;
}

if (cardId === "crm") {
  const sources: DashboardCardSource[] = [];

  if (has("hubspot")) {
    sources.push({
      label: "HubSpot",
      variant: "success",
    });
  }

  if (has("salesforce")) {
    sources.push({
      label: "Salesforce",
      variant: "success",
    });
  }

  return sources.length ? sources : undefined;
}

if (cardId === "finance") {
  const sources: DashboardCardSource[] = [];

  if (has("stripe")) {
    sources.push({
      label: "Stripe",
      variant: "success",
    });
  }

  if (has("quickbooks")) {
    sources.push({
      label: "QuickBooks",
      variant: "success",
    });
  }

  return sources.length ? sources : undefined;
}

if (cardId === "booking") {
  const sources: DashboardCardSource[] = [];

  if (has("calendly")) {
    sources.push({
      label: "Calendly",
      variant: "success",
    });
  }

  if (has("googleCalendar")) {
    sources.push({
      label: "Google Calendar",
      variant: "success",
    });
  }

  return sources.length ? sources : undefined;
}

return undefined;
}

function StatusPill({
  status,
  labels,
}: {
  status: DashboardHydrationCard["status"];
  labels: DashboardLabels["status"];
}) {
  const label =
    status === "ok"
      ? labels.ok
      : status === "warn"
        ? labels.warn
        : status === "error"
          ? labels.error
          : labels.disabled;

  return (
    <span className="rounded-full border px-2 py-0.5 text-[11px] text-slate-600">
      {label}
    </span>
  );
}

function EmptyCardState({
  labels,
  description,
  variant,
}: {
  labels: DashboardLabels;
  description?: string;
  variant: DashboardCardVariant;
}) {
  const message = description ?? labels.emptyState.noData;

  if (variant === "report") {
    return (
      <div className="text-sm leading-6 text-slate-500">
        {message}
      </div>
    );
  }

  return (
    <div className="text-sm opacity-70">
      {message}
      <br />

      <a
        href="/settings/integrations"
        className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-100"
      >
        {labels.emptyState.connectProvider}
        <span aria-hidden>→</span>
      </a>
    </div>
  );
}

const HYDRATION_KEY_BY_CARD_ID: Partial<
  Record<DashboardCardId, string>
> = {
  analytics: "ga_overview",
  social: "meta_ads",
  marketing: "google_ads",
  sales: "sales",

  // Keep using the existing hydration payload for now.
  finance: "accounting",

  aiInsights: "ai_insights",
};

export function DashboardCardView({
  definition,
  hydrationCards,
  labels,
  aiInsight,
  variant = "dashboard",
}: DashboardCardViewProps) {
  const isReport = variant === "report";

  const hydrationKey =
    HYDRATION_KEY_BY_CARD_ID[definition.id] ?? definition.id;

  const hydration = hydrationCards?.find(
    (card) => card.key === hydrationKey,
  );

  const localizedCardLabels: Partial<
    Record<DashboardCardId, { title: string; subtitle: string }>
  > = {
    analytics: labels.cards.analytics,
    sales: labels.cards.sales,
    marketing: labels.cards.marketing,
    downtime: labels.cards.downtime,
    social: labels.cards.social,
    booking: labels.cards.booking,
    aiInsights: {
      title: "AI Insights",
      subtitle: "Résumé intelligent",
    },
  };

  const localized = localizedCardLabels[definition.id];
  const title = localized?.title ?? definition.title;
  const subtitle = localized?.subtitle ?? definition.subtitle;

  if (definition.id === "aiInsights") {
    const chart = aiInsight as AIInsightPayload & {
      metric?: string;
      trend?: { label: string; value: number }[];
    };
    const readTrend = (value: unknown): { label: string; value: number }[] => {
      if (!Array.isArray(value)) return [];
      return value.flatMap((point: unknown) => {
        if (!point || typeof point !== "object") return [];
        const item = point as { label?: unknown; value?: unknown };
        const value = toNumber(item.value);
        return typeof item.label === "string" && item.label.trim() && value !== null
          ? [{ label: item.label, value }]
          : [];
      });
    };
    let trend = readTrend(chart.trend);
    let metric = chart.metric?.trim() || "Trend";

    // Display the real daily series already used by the dashboard cards.
    // This fallback is for the live AI card only; historical report rendering
    // continues to use the chart supplied with the saved insight.
    if (!isReport && trend.length === 0) {
      for (const key of ["sales", "ga_overview"]) {
        const source = hydrationCards?.find((card) => card.key === key);
        if (!source || (source.status !== "ok" && source.status !== "warn")) continue;
        const series = readTrend(source.meta?.series);
        if (series.length === 0) continue;
        trend = series;
        const currency = typeof source.meta?.currency === "string" &&
          /^[a-z]{3}$/i.test(source.meta.currency.trim())
          ? source.meta.currency.trim().toUpperCase() : null;
        metric = key === "sales"
          ? `Sales${currency ? ` (${currency})` : ""}`
          : "Page views";
        break;
      }
    }

    const insightProps = {
      title,
      metric,
      trend,
      status: aiInsight.status,
      headline: aiInsight.headline,
      whyItMatters: aiInsight.whyItMatters,
      recommendedAction: aiInsight.recommendedAction,
      sourceNote: aiInsight.sourceNote,
    };

    return isReport ? (
      <AIInsightsReportCard {...insightProps} />
    ) : (
      <AIInsightsCard {...insightProps} />
    );
  }

  const salesRevenue = toNumber(
    hydration?.meta?.currentRevenue ??
      hydration?.meta?.revenue ??
      hydration?.meta?.amount,
  );

  const salesOrderCount = toNumber(
    hydration?.meta?.orderCount,
  );

  const salesCurrency =
    typeof hydration?.meta?.currency === "string" &&
    hydration.meta.currency.trim().length === 3
      ? hydration.meta.currency.toUpperCase()
      : "EUR";

   const hasHydratedData =
    definition.id === "sales"
      ? salesRevenue !== null || salesOrderCount !== null
      : definition.id === "crm"
        ? hydration?.status === "ok"
        : typeof hydration?.value === "string" &&
          hydration.value.trim().length > 0;

  const headerValue =
    definition.id === "sales" && salesRevenue !== null
      ? formatCurrency(salesRevenue, salesCurrency)
      : hydration?.value ?? "";

  const updatedLabel =
    hasHydratedData &&
    typeof hydration?.meta?.updatedAt === "string"
      ? formatUpdatedLabel(hydration.meta.updatedAt)
      : hasHydratedData &&
          typeof hydration?.meta?.updatedLabel === "string"
        ? hydration.meta.updatedLabel
        : hasHydratedData
          ? "Updated just now"
          : undefined;

  const hydratedSources = getHydratedSourcesForCard(
    definition.id,
    hydrationCards,
  );

    const crmContacts = Array.isArray(hydration?.meta?.contacts)
    ? (hydration.meta.contacts as CrmContactPreview[])
    : null;

  const hasCrmPipelineData = [
    hydration?.meta?.pipelineValue,
    hydration?.meta?.opportunities,
    hydration?.meta?.qualifiedLeads,
    hydration?.meta?.winRate,
  ].some((value) => toNumber(value) !== null) ||
    (Array.isArray(hydration?.meta?.stages) &&
      hydration.meta.stages.length > 0);

  return (
    <Card
      title={title}
      subtitle={subtitle}
      sources={hydratedSources}
      updatedLabel={updatedLabel}
      data-report-card={isReport ? "true" : undefined}
      className={
        isReport
          ? "h-auto min-h-0"
          : "min-h-[408px] md:h-[408px]"
      }
    >
      {hydration && definition.id !== "crm" ? (
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">
            {headerValue}

            {hydration.delta ? (
              <span className="ml-2 text-xs font-medium text-slate-500">
                {hydration.delta}
              </span>
            ) : null}
          </div>

          <StatusPill
            status={hydration.status}
            labels={labels.status}
          />
        </div>
      ) : null}

      {definition.id === "analytics" ? (
        <AnalyticsMiniChart
          series={
            Array.isArray(hydration?.meta?.series)
              ? hydration.meta.series
              : []
          }
          allowRangeToggle={!isReport}
          initialRange="30d"
          showFullSeries={isReport}
          animate={!isReport}
        />
      ) : definition.id === "sales" ? (
        hasHydratedData ? (
          <div className="space-y-4">
            <div className="text-sm text-slate-600">
              {salesOrderCount !== null
                ? `${salesOrderCount} commande${
                    salesOrderCount > 1 ? "s" : ""
                  }`
                : hydration?.meta?.description ?? subtitle}
            </div>

            <SalesMiniBarChart
              series={
                Array.isArray(hydration?.meta?.series)
                  ? hydration.meta.series
                  : []
              }
              currency={salesCurrency}
              height={190}
              allowRangeToggle={!isReport}
              showFullSeries={isReport}
              animate={!isReport}
            />
          </div>
        ) : (
          <EmptyCardState
            labels={labels}
            variant={variant}
          />
        )
      ) : definition.id === "marketing" ? (
  <div className="space-y-4">
    <MarketingConversionsChart
      series={
        Array.isArray(hydration?.meta?.series)
          ? hydration.meta.series
          : []
      }
      preview={!hasHydratedData}
      animate={!isReport}
    />

    {!hasHydratedData && !isReport ? (
      <div className="text-xs text-slate-400">
        Campaign data will appear here once available.
      </div>
    ) : null}
  </div>
        
      ) : definition.id === "social" ? (
  <div className="space-y-4">
    <SocialMediaChart
      series={
        Array.isArray(hydration?.meta?.series)
          ? hydration.meta.series
          : []
      }
      reach={toNumber(hydration?.meta?.reach) ?? 0}
      engagementRate={
        toNumber(hydration?.meta?.engagementRate) ?? 0
      }
      preview={!hasHydratedData}
      animate={!isReport}
    />

    {!hasHydratedData && !isReport ? (
      <div className="text-xs text-slate-400">
        Social performance data will appear here once available.
      </div>
    ) : null}
    </div>

) : definition.id === "crm" ? (
  <div
    className={
      isReport
        ? "space-y-4"
        : "grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2"
    }
  >
    {!isReport ? (
      <div className="min-w-0 md:border-r md:border-slate-200 md:pr-5">
        <p className="mb-2 text-xs font-bold text-slate-700">
          Recent contacts
        </p>

        {hydration?.status === "error" ? (
          <p className="text-xs text-slate-500">
            HubSpot contacts could not be loaded.
          </p>
        ) : crmContacts !== null ? (
          crmContacts.length === 0 ? (
            <p className="text-xs text-slate-500">
              No contacts in HubSpot yet.
            </p>
          ) : (
            <div className="relative">
  <ul
    aria-label="Recent HubSpot contacts"
    tabIndex={0}
    className="max-h-[180px] divide-y divide-slate-200 overflow-y-auto pb-6 pr-2"
  >
    {crmContacts.slice(0, 5).map((contact) => (
      <li
        key={contact.id}
        className="flex items-center justify-between gap-3 py-1.5"
      >
        <div className="min-w-0">
          <p className="truncate text-sm text-slate-900">
            {contact.name ||
              contact.company ||
              "Unnamed contact"}
          </p>

          {contact.name && contact.company ? (
            <p className="truncate text-xs text-slate-500">
              {contact.company}
            </p>
          ) : null}
        </div>

        <span className="max-w-[40%] shrink-0 text-right text-xs text-slate-600">
          {formatLeadStatus(contact.leadStatus)}
        </span>
      </li>
    ))}
  </ul>

  {crmContacts.length > 3 ? (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-white via-white/70 to-transparent"/>
  ) : null}
</div>
          )
        ) : (
          <p className="text-xs text-slate-500">
            Contacts will appear here once available.
          </p>
        )}
      </div>
    ) : null}

    <div className="min-w-0">
      {!isReport ? (
        <p className="mb-2 text-xs font-bold text-slate-700">
          Pipeline performance
        </p>
      ) : null}

      <CrmPipelineChart
        pipelineValue={
          toNumber(hydration?.meta?.pipelineValue) ?? 0
        }
        opportunities={
          toNumber(hydration?.meta?.opportunities) ?? 0
        }
        qualifiedLeads={
          toNumber(hydration?.meta?.qualifiedLeads) ?? 0
        }
        winRate={toNumber(hydration?.meta?.winRate) ?? 0}
        stages={
          Array.isArray(hydration?.meta?.stages)
            ? hydration.meta.stages
            : []
        }
        currency={
          typeof hydration?.meta?.currency === "string"
            ? hydration.meta.currency
            : "EUR"
        }
        preview={!hasCrmPipelineData}
        animate={!isReport}
      />
    </div>
  </div>
  
  ) : definition.id === "downtime" ? (
  <div className="space-y-4">
    <DowntimeActivityChart
      currentStatus={
        typeof hydration?.meta?.currentStatus === "string"
          ? hydration.meta.currentStatus
          : "No monitoring data"
      }
      uptime={
        toNumber(hydration?.meta?.uptime) ?? 0
      }
      incidents={
        toNumber(hydration?.meta?.incidents) ?? 0
      }
      downtimeMinutes={
        toNumber(hydration?.meta?.downtimeMinutes) ?? 0
      }
      series={
        Array.isArray(hydration?.meta?.series)
          ? hydration.meta.series
          : []
      }
      preview={!hasHydratedData}
      animate={!isReport}
    />

    {!hasHydratedData && !isReport ? (
      <div className="text-xs text-slate-400">
        Monitoring data will appear here once available.
      </div>
    ) : null}
  
  </div>
  
) : definition.id === "booking" ? (
  <div className="space-y-4">
    <BookingActivityChart
      totalBookings={
        toNumber(hydration?.meta?.totalBookings) ?? 0
      }
      upcomingBookings={
        toNumber(hydration?.meta?.upcomingBookings) ?? 0
      }
      cancellationRate={
        toNumber(hydration?.meta?.cancellationRate) ?? 0
      }
      noShowRate={
        toNumber(hydration?.meta?.noShowRate) ?? 0
      }
      series={
        Array.isArray(hydration?.meta?.series)
          ? hydration.meta.series
          : []
      }
      preview={!hasHydratedData}
      animate={!isReport}
    />

    {!hasHydratedData && !isReport ? (
      <div className="text-xs text-slate-400">
        Booking activity will appear here once available.
      </div>
    ) : null}
  </div>

      ) : definition.id === "finance" ? (
        hasHydratedData ? (
          <AccountingBalanceBreakdown
            availableBalance={
              toNumber(hydration?.meta?.availableBalance) ?? 0
            }
            pendingBalance={
              toNumber(hydration?.meta?.pendingBalance) ?? 0
            }
            fees={toNumber(hydration?.meta?.fees) ?? 0}
            net={toNumber(hydration?.meta?.net) ?? 0}
            currency={
              typeof hydration?.meta?.currency === "string"
                ? hydration.meta.currency
                : "EUR"
            }
          />
        ) : (
          <EmptyCardState
            labels={labels}
            variant={variant}
          />
        )
      ) : (
        <EmptyCardState
          labels={labels}
          variant={variant}
        />
      )}
    </Card>
  );
}