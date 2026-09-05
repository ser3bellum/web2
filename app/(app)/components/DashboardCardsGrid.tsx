"use client";

import type { Dictionary } from "@/lib/i18n/getDictionary";
import type { AIInsightPayload } from "@/types/ai";
import type { DashboardHydrationCard } from "@/types/dashboard";
import { useEffect, useMemo, useState } from "react";
import { DashboardCardView } from "./DashboardCardView";
import {
  DASHBOARD_CARDS,
  type DashboardCardId,
} from "./DashboardCards";
import {
  DASHBOARD_ENABLED_KEY,
  loadJson,
} from "./dashboardPreferences";
import DailyReportModalController from "./DailyReportModalController";
import { SortableDashboardGrid } from "./SortableDashboardGrid";

type DashboardCardsGridLabels = Dictionary["dashboard"];

export default function DashboardCardsGrid({
  hydrationCards,
  labels,
  endUserId,
  workspaceId,
}: {
  hydrationCards?: DashboardHydrationCard[];
  labels: DashboardCardsGridLabels;
  endUserId: string;
  workspaceId: string | null;
}) {
  const [mounted, setMounted] = useState(false);

  const [enabledIds, setEnabledIds] = useState<
    DashboardCardId[] | null
  >(null);

  const [aiInsight, setAiInsight] = useState<AIInsightPayload>({
    status: "loading",
    headline: "",
    whyItMatters: "",
    recommendedAction: "",
    sourceNote: "",
  });

  const [, forceTick] = useState(0);

  useEffect(() => {
    setMounted(true);

    const syncEnabledCards = () => {
      const savedEnabled = loadJson<DashboardCardId[]>(
        DASHBOARD_ENABLED_KEY,
      );

      if (savedEnabled && savedEnabled.length) {
        const validIds = savedEnabled.filter((id) =>
          DASHBOARD_CARDS.some((card) => card.id === id),
        );

        setEnabledIds(validIds);
        return;
      }

      setEnabledIds(
        DASHBOARD_CARDS
          .filter((card) => card.defaultEnabled)
          .map((card) => card.id),
      );
    };

    syncEnabledCards();

    window.addEventListener(
      "sb-dashboard-preferences-updated",
      syncEnabledCards,
    );

    return () => {
      window.removeEventListener(
        "sb-dashboard-preferences-updated",
        syncEnabledCards,
      );
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      forceTick((value) => value + 1);
    }, 60000);

    return () => window.clearInterval(interval);
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

        const response = await fetch(
          `/api/ai/insight?workspaceId=${encodeURIComponent(
            endUserId,
          )}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch AI insight");
        }

        const data: AIInsightPayload = await response.json();

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

    void fetchAIInsight();

    return () => {
      cancelled = true;
    };
  }, [endUserId]);

  const visibleCards = useMemo(() => {
    if (!enabledIds) return [];

    return DASHBOARD_CARDS.filter((card) =>
      enabledIds.includes(card.id),
    );
  }, [enabledIds]);

  if (!mounted) {
    return <section className="min-h-[420px] min-w-0" />;
  }

  return (
    <section className="min-w-0">
      {workspaceId ? (
        <DailyReportModalController workspaceId={workspaceId} />
      ) : null}

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
