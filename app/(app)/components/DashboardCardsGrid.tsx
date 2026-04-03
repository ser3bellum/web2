"use client";

import { useEffect, useMemo, useState } from "react";
import { AnalyticsMiniChart } from "app/(app)/components/AnalyticsMiniChart";
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
import type { Dictionary } from "@/lib/i18n/getDictionary";

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

export default function DashboardCardsGrid({
  hydrationCards,
  labels,
}: {
  hydrationCards?: HydrationCard[];
  labels: DashboardCardsGridLabels;
}) {
  const [mounted, setMounted] = useState(false);
  const [enabledIds, setEnabledIds] = useState<DashboardCardId[] | null>(null);

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
          };

          const localized = localizedCardLabels[c.id];
          const localizedTitle = localized?.title ?? c.title;
          const localizedSubtitle = localized?.subtitle ?? c.subtitle;

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
                    {h.value}
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
                <AnalyticsMiniChart />
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