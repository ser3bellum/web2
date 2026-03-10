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

type HydrationCard = {
  key: string;
  title: string;
  status: "ok" | "warn" | "error" | "disabled";
  value: string;
  delta?: string;
  meta?: Record<string, any>;
};

function renderIconSafe(icon: ReactNode) {
  if (!icon) return null;
  return icon;
}

const HYDRATION_KEY_BY_CARD_ID: Record<string, string> = {
  analytics: "ga_overview",
  integrations: "integrations",
};

function StatusPill({ status }: { status: HydrationCard["status"] }) {
  const label =
    status === "ok"
      ? "OK"
      : status === "warn"
      ? "Attention"
      : status === "error"
      ? "Error"
      : "Disabled";

  return (
    <span className="rounded-full border px-2 py-0.5 text-[11px] text-slate-600">
      {label}
    </span>
  );
}

export default function DashboardCardsGrid({
  hydrationCards,
}: {
  hydrationCards?: HydrationCard[];
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

  window.addEventListener("sb-dashboard-preferences-updated", syncEnabledCards);
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

          return (
            <Card
              key={c.id}
              title={c.title}
              subtitle={c.subtitle}
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
                  <StatusPill status={h.status} />
                </div>
              )}

              {c.id === "analytics" ? (
                <AnalyticsMiniChart />
              ) : (
                <div className="text-sm opacity-70">
                  {(c as any).description ??
                    "No data yet. Connect a service to start tracking activity."}
                  <br />
                  <a
                    href="/settings/integrations"
                    className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    Connect provider →
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