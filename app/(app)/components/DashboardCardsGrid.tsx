"use client";

import type { Dictionary } from "@/lib/i18n/getDictionary";
import type { AIInsightPayload } from "@/types/ai";
import type { DashboardHydrationCard } from "@/types/dashboard";
import { useEffect, useMemo, useState } from "react";
import { DashboardCardView } from "./DashboardCardView";
import { DASHBOARD_CARDS, type DashboardCardId } from "./DashboardCards";
import { DASHBOARD_ENABLED_KEY, loadJson } from "./dashboardPreferences";
import DailyReportModalController from "./DailyReportModalController";
import { SortableDashboardGrid } from "./SortableDashboardGrid";

type DashboardCardsGridLabels = Dictionary["dashboard"];
const blank = (status: AIInsightPayload["status"]): AIInsightPayload => ({
  status, headline: "", whyItMatters: "", recommendedAction: "", sourceNote: "",
});

export default function DashboardCardsGrid({
  hydrationCards, labels, endUserId, workspaceId, aiSyncRunId,
}: {
  hydrationCards?: DashboardHydrationCard[];
  labels: DashboardCardsGridLabels;
  endUserId: string;
  workspaceId: string | null;
  aiSyncRunId?: string | null;
}) {
  const [mounted, setMounted] = useState(false);
  const [enabledIds, setEnabledIds] = useState<DashboardCardId[] | null>(null);
  const [aiInsight, setAiInsight] = useState<AIInsightPayload>(blank("loading"));
  const [, forceTick] = useState(0);

  // Ignore display timestamps but react to new metrics, series, statuses and periods.
  const dataKey = useMemo(() => JSON.stringify((hydrationCards ?? []).map((card) => {
    const { updatedAt: _at, updatedLabel: _label, ...meta } = card.meta ?? {};
    return { key: card.key, status: card.status, value: card.value, delta: card.delta, meta };
  })), [hydrationCards]);
  const selectedPeriod = useMemo(() => {
    const card = hydrationCards?.find((item) =>
      typeof item.meta?.from === "string" && typeof item.meta?.to === "string");
    return {
      from: typeof card?.meta?.from === "string" ? card.meta.from : undefined,
      to: typeof card?.meta?.to === "string" ? card.meta.to : undefined,
    };
  }, [hydrationCards]);

  useEffect(() => {
    setMounted(true);
    const syncEnabledCards = () => {
      const saved = loadJson<DashboardCardId[]>(DASHBOARD_ENABLED_KEY);
      setEnabledIds(saved?.length
        ? saved.filter((id) => DASHBOARD_CARDS.some((card) => card.id === id))
        : DASHBOARD_CARDS.filter((card) => card.defaultEnabled).map((card) => card.id));
    };
    syncEnabledCards();
    window.addEventListener("sb-dashboard-preferences-updated", syncEnabledCards);
    return () => window.removeEventListener("sb-dashboard-preferences-updated", syncEnabledCards);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => forceTick((value) => value + 1), 60000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    async function fetchAIInsight() {
      if (!endUserId || aiSyncRunId === null) { setAiInsight(blank("empty")); return; }
      setAiInsight(blank("loading"));
      try {
        const pageQuery = new URLSearchParams(window.location.search);
        const url = new URL("/api/ai/insight", window.location.origin);
        const from = selectedPeriod.from ?? pageQuery.get("from");
        const to = selectedPeriod.to ?? pageQuery.get("to");
        if (from) url.searchParams.set("from", from);
        if (to) url.searchParams.set("to", to);
        if (aiSyncRunId) url.searchParams.set("syncRunId", aiSyncRunId);
        const response = await fetch(url.toString(), {
          method: "GET", cache: "no-store", signal: controller.signal,
        });
        if (!response.ok) throw new Error("Failed to fetch AI insight");
        const data: AIInsightPayload = await response.json();
        if (!cancelled) setAiInsight(data);
      } catch {
        if (!cancelled) setAiInsight(blank("error"));
      }
    }
    void fetchAIInsight();
    return () => { cancelled = true; controller.abort(); };
  }, [endUserId, workspaceId, aiSyncRunId, selectedPeriod.from, selectedPeriod.to, dataKey]);

  const visibleCards = useMemo(() => enabledIds
    ? DASHBOARD_CARDS.filter((card) => enabledIds.includes(card.id)) : [], [enabledIds]);
  if (!mounted) return <section className="min-h-[420px] min-w-0" />;
  return (
    <section className="min-w-0">
      {workspaceId ? <DailyReportModalController workspaceId={workspaceId} /> : null}
      <SortableDashboardGrid
        defs={visibleCards}
        renderCard={(definition) => (
          <DashboardCardView
            key={definition.id}
            definition={definition}
            hydrationCards={hydrationCards}
            labels={labels}
            aiInsight={aiInsight}
            variant="dashboard"
          />
        )}
      />
    </section>
  );
}
