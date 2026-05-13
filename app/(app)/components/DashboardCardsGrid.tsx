"use client";

import { useEffect, useMemo, useState } from "react";
import { AnalyticsMiniChart } from "app/(app)/components/AnalyticsMiniChart";
import { AIInsightsCard } from "app/(app)/components/AIInsightsCard";
import { Card } from "app/(app)/components/Card";
import {
  DASHBOARD_CARDS,
  type DashboardCardId,
} from "app/(app)/components/DashboardCards";
import { SortableDashboardGrid } from "app/(app)/components/SortableDashboardGrid";
import {
  DASHBOARD_ENABLED_KEY,
  loadJson,
} from "app/(app)/components/dashboardPreferences";
import type { ReactNode } from "react";
import { SalesMiniBarChart } from "app/(app)/components/SalesMiniBarChart";
import { AccountingBalanceBreakdown } from "app/(app)/components/AccountingBalanceBreakdown";
import type { Dictionary } from "@/lib/i18n/getDictionary";
import type { AIInsightPayload } from "@/types/ai";

type HydrationCard = {
  key: string;
  title: string;
  status: "ok" | "warn" | "error" | "disabled";
  value: string;
  delta?: string;
  meta?: Record<string, any>;
};

type HydratedSource = {
  label: string;
  variant?: "default" | "success" | "warning" | "danger";
};

type DashboardCardsGridLabels = Dictionary["dashboard"];

function renderIconSafe(icon: ReactNode) {
  if (!icon) return null;
  return icon;
}

const HYDRATION_KEY_BY_CARD_ID: Record<string, string> = {
  analytics: "ga_overview",
  integrations: "integrations",
  social: "meta_ads",
  marketing: "google_ads",
  sales: "sales",
  accounting: "accounting",
  aiInsights: "ai_insights",
};

function StatusPill({
  status,
  labels,
}: {
  status: HydrationCard["status"];
  labels: DashboardCardsGridLabels["status"];
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
}: {
  labels: DashboardCardsGridLabels;
  description?: string;
}) {
  return (
    <div className="text-sm opacity-70">
      {description ?? labels.emptyState.noData}
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

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
function getHydratedSourcesForCard(
  cardId: DashboardCardId,
  integrations: HydrationCard[] | undefined
): HydratedSource[] | undefined {
  const integrationsCard = integrations?.find((x) => x.key === "integrations");
  const connected = integrationsCard?.meta?.connectedIntegrations;

  if (!Array.isArray(connected)) return undefined;

  const has = (key: string) =>
    connected.some((integration: any) => integration.key === key);

  if (cardId === "marketing") {
  const sources: HydratedSource[] = [];

  if (has("googleAds")) {
    sources.push({
      label: "Google Ads",
      variant: "success",
    });
  }

  return sources.length ? sources : undefined;
}

if (cardId === "social") {
  const sources: HydratedSource[] = [];

  if (has("meta")) {
    sources.push({
      label: "Meta Marketing API",
      variant: "warning",
    });
  }

  return sources.length ? sources : undefined;
}

  if (cardId === "analytics") {
    const sources: HydratedSource[] = [];

    if (has("google")) {
      sources.push({
        label: "Google Analytics",
        variant: "success",
      });
    }

    return sources.length ? sources : undefined;
  }

  if (cardId === "accounting") {
    const sources: HydratedSource[] = [];

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

export default function DashboardCardsGrid({
  hydrationCards,
  labels,
  endUserId,
}: {
  hydrationCards?: HydrationCard[];
  labels: DashboardCardsGridLabels;
  endUserId: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [enabledIds, setEnabledIds] = useState<DashboardCardId[] | null>(null);
  const [aiInsight, setAiInsight] = useState<AIInsightPayload>({
    status: "loading",
    headline: "",
    whyItMatters: "",
    recommendedAction: "",
    sourceNote: "",
  });

  useEffect(() => {
    setMounted(true);

    const syncEnabledCards = () => {
      const savedEnabled = loadJson<DashboardCardId[]>(DASHBOARD_ENABLED_KEY);

      if (savedEnabled && savedEnabled.length) {
        const validIds = savedEnabled.filter((id) =>
          DASHBOARD_CARDS.some((card) => card.id === id)
        );
        setEnabledIds(validIds);
        return;
      }

      setEnabledIds(
        DASHBOARD_CARDS.filter((c) => c.defaultEnabled).map((c) => c.id)
      );
    };

    syncEnabledCards();

    window.addEventListener(
      "sb-dashboard-preferences-updated",
      syncEnabledCards
    );

    return () => {
      window.removeEventListener(
        "sb-dashboard-preferences-updated",
        syncEnabledCards
      );
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchAIInsight() {
      if (!endUserId) {
        if (!cancelled) {
          setAiInsight({
            status: "empty",
            headline: "",
            whyItMatters: "",
            recommendedAction: "",
            sourceNote: "",
          });
        }
        return;
      }

      try {
        setAiInsight({
          status: "loading",
          headline: "",
          whyItMatters: "",
          recommendedAction: "",
          sourceNote: "",
        });

        const res = await fetch(
          `/api/ai/insight?workspaceId=${encodeURIComponent(endUserId)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch AI insight");
        }

        const data: AIInsightPayload = await res.json();

        if (!cancelled) {
          setAiInsight(data);
        }
      } catch {
        if (!cancelled) {
          setAiInsight({
            status: "error",
            headline: "",
            whyItMatters: "",
            recommendedAction: "",
            sourceNote: "",
          });
        }
      }
    }

    fetchAIInsight();

    return () => {
      cancelled = true;
    };
  }, [endUserId]);

  const visibleCards = useMemo(() => {
    if (!enabledIds) return [];
    return DASHBOARD_CARDS.filter((card) => enabledIds.includes(card.id));
  }, [enabledIds]);

  if (!mounted) {
    return <section className="min-h-[420px]" />;
  }

  return (
    <section>
      <SortableDashboardGrid
        defs={visibleCards}
        renderCard={(c) => {
          const hydrationKey = HYDRATION_KEY_BY_CARD_ID[c.id] ?? c.id;
          const h = hydrationCards?.find((x) => x.key === hydrationKey);

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

          const localized = localizedCardLabels[c.id];
          const localizedTitle = localized?.title ?? c.title;
          const localizedSubtitle = localized?.subtitle ?? c.subtitle;

          const salesRevenue = toNumber(
            h?.meta?.currentRevenue ?? h?.meta?.revenue ?? h?.meta?.amount
          );

          const salesOrderCount = toNumber(h?.meta?.orderCount);

          const salesCurrency =
            typeof h?.meta?.currency === "string" &&
            h.meta.currency.trim().length === 3
              ? h.meta.currency.toUpperCase()
              : "EUR";

          const hasHydratedData =
            c.id === "sales"
              ? salesRevenue !== null || salesOrderCount !== null
              : typeof h?.value === "string" && h.value.trim().length > 0;

          const headerValue =
            c.id === "sales" && salesRevenue !== null
              ? formatCurrency(salesRevenue, salesCurrency)
              : h?.value ?? "";

          const updatedLabel =
            hasHydratedData && typeof h?.meta?.updatedLabel === "string"
            ? h.meta.updatedLabel
            : hasHydratedData
          ? "Updated just now"
          : undefined;

          const hydratedSources = getHydratedSourcesForCard(c.id, hydrationCards);

          if (c.id === "aiInsights") {
            return (
              <AIInsightsCard
                key={c.id}
                title={localizedTitle}
                status={aiInsight.status}
                headline={aiInsight.headline}
                whyItMatters={aiInsight.whyItMatters}
                recommendedAction={aiInsight.recommendedAction}
                sourceNote={aiInsight.sourceNote}
              />
            );
          }

          return (
            <Card
            key={c.id}
            title={localizedTitle}
            subtitle={localizedSubtitle}
            sources={hydratedSources}
            updatedLabel={updatedLabel}
            rightSlot={renderIconSafe((c as any).icon)}
            className="h-[408px]"
              >
              {h && (
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-900">
                    {headerValue}
                    {h.delta ? (
                      <span className="ml-2 text-xs font-medium text-slate-500">
                        {h.delta}
                      </span>
                    ) : null}
                  </div>
                  <StatusPill status={h.status} labels={labels.status} />
                </div>
              )}

              {c.id === "analytics" ? (
               <AnalyticsMiniChart
              series={Array.isArray(h?.meta?.series) ? h.meta.series : []}
              allowRangeToggle
              initialRange="30d"
              />
              ) : c.id === "sales" ? (
                hasHydratedData ? (
                  <div className="space-y-4">
                    <div className="text-sm text-slate-600">
                      {salesOrderCount !== null
                        ? `${salesOrderCount} commande${
                            salesOrderCount > 1 ? "s" : ""
                          }`
                        : h?.meta?.description ?? localizedSubtitle}
                    </div>

                    <SalesMiniBarChart
                      series={
                        Array.isArray(h?.meta?.series) ? h.meta.series : []
                      }
                      currency={salesCurrency}
                      height={190}
                    />
                  </div>
                ) : (
                  <EmptyCardState labels={labels} />
                )
              ) : c.id === "marketing" ? (
              hasHydratedData ? (
              <div className="space-y-3 text-sm text-slate-600">
              <div>Google Ads data will appear here.</div>
              </div>
               ) : (
              <EmptyCardState labels={labels} />
               )
              ) : c.id === "social" ? (
              hasHydratedData ? (
             <div className="space-y-3 text-sm text-slate-600">
              {typeof h?.meta?.accessLevel === "string" ? (
              <div>
              <span className="font-medium text-slate-800">Access:</span>{" "}
             {h.meta.accessLevel}
            </div>
            ) : null}
            </div>
           ) : (
         <EmptyCardState labels={labels} />
           )
                ) : c.id === "accounting" ? (
                hasHydratedData ? (
          <AccountingBalanceBreakdown
           availableBalance={toNumber(h?.meta?.availableBalance) ?? 0}
           pendingBalance={toNumber(h?.meta?.pendingBalance) ?? 0}
          fees={toNumber(h?.meta?.fees) ?? 0}
          net={toNumber(h?.meta?.net) ?? 0}
          currency={
        typeof h?.meta?.currency === "string" ? h.meta.currency : "EUR"
      }
    />
  ) : (
    <EmptyCardState labels={labels} />
  )
              ) : (
                <EmptyCardState
                  labels={labels}
                  description={(c as any).description}
                />
              )}
            </Card>
          );
        }}
      />
    </section>
  );
}