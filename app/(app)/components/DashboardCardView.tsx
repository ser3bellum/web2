"use client";

import type { Dictionary } from "@/lib/i18n/getDictionary";
import type { AIInsightPayload } from "@/types/ai";
import type { DashboardHydrationCard } from "@/types/dashboard";
import { AccountingBalanceBreakdown } from "./AccountingBalanceBreakdown";
import { AIInsightsCard } from "./AIInsightsCard";
import { AIInsightsReportCard } from "./AIInsightsReportCard";
import { AnalyticsMiniChart } from "./AnalyticsMiniChart";
import { Card } from "./Card";
import type {
  DashboardCardDef,
  DashboardCardId,
  DashboardCardSource,
} from "./DashboardCards";
import { SalesMiniBarChart } from "./SalesMiniBarChart";

type DashboardLabels = Dictionary["dashboard"];
type DashboardCardVariant = "dashboard" | "report";

type DashboardCardViewProps = {
  definition: DashboardCardDef;
  hydrationCards?: DashboardHydrationCard[];
  labels: DashboardLabels;
  aiInsight: AIInsightPayload;
  variant?: DashboardCardVariant;
};

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
    return has("googleAds")
      ? [{ label: "Google Ads", variant: "success" }]
      : undefined;
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
    return has("shopify")
      ? [{ label: "Shopify", variant: "success" }]
      : undefined;
  }

  if (cardId === "accounting") {
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

    if (has("xero")) {
      sources.push({
        label: "Xero",
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
  accounting: "accounting",
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
    cpu: labels.cards.cpu,
    threats: labels.cards.threats,
    accounting: labels.cards.accounting,
    social: labels.cards.social,
    booking: labels.cards.booking,
    productivity: labels.cards.productivity,
    aiInsights: {
      title: "AI Insights",
      subtitle: "Résumé intelligent",
    },
  };

  const localized = localizedCardLabels[definition.id];
  const title = localized?.title ?? definition.title;
  const subtitle = localized?.subtitle ?? definition.subtitle;

  if (definition.id === "aiInsights") {
    const insightProps = {
      title,
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
      {hydration ? (
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
        hasHydratedData ? (
          <div className="space-y-3 text-sm text-slate-600">
            <div>Google Ads data will appear here.</div>
          </div>
        ) : (
          <EmptyCardState
            labels={labels}
            variant={variant}
          />
        )
      ) : definition.id === "social" ? (
        hasHydratedData ? (
          <div className="space-y-3 text-sm text-slate-600">
            {typeof hydration?.meta?.accessLevel === "string" ? (
              <div>
                <span className="font-medium text-slate-800">
                  Access:
                </span>{" "}
                {hydration.meta.accessLevel}
              </div>
            ) : null}
          </div>
        ) : (
          <EmptyCardState
            labels={labels}
            variant={variant}
          />
        )
      ) : definition.id === "accounting" ? (
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