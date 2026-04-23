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

type DashboardCardsGridLabels = Dictionary["dashboard"];

function renderIconSafe(icon: ReactNode) {
  if (!icon) return null;
  return icon;
}

const HYDRATION_KEY_BY_CARD_ID: Record<string, string> = {
  analytics: "ga_overview",
  integrations: "integrations",
  sales: "sales",
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
                  allowRangeToggle={false}
                  initialRange="7d"
                />
              ) : c.id === "sales" ? (
                hasHydratedData ? (
                  <div className="space-y-4">
                    <div className="text-sm text-slate-600">
                      {salesOrderCount !== null
                        ? `${salesOrderCount} commande${salesOrderCount > 1 ? "s" : ""}`
                        : h?.meta?.description ?? localizedSubtitle}
                    </div>

                    <SalesMiniBarChart
                      series={Array.isArray(h?.meta?.series) ? h.meta.series : []}
                      currency={salesCurrency}
                      height={170}
                    />
                  </div>
                ) : (
                  <div className="text-sm opacity-70">
                    {labels.emptyState.noData}
                    <br />
                    <a
                      href="/settings/integrations"
                      className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-100"
                    >
                      {labels.emptyState.connectProvider}
                      <span aria-hidden>→</span>
                    </a>
                  </div>
                )
              ) : (
                <div className="text-sm opacity-70">
                  {(c as any).description ?? labels.emptyState.noData}
                  <br />
                  <a
                    href="/settings/integrations"
                    className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-100"
                  >
                    {labels.emptyState.connectProvider}
                    <span aria-hidden>→</span>
                  </a>
                </div>
              )}
            </Card>
          );
        }}
      />
    </section>
  );
}