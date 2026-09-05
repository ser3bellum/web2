"use client";

import type { Dictionary } from "@/lib/i18n/getDictionary";
import type { AIInsightPayload } from "@/types/ai";
import type {
  DashboardHydration,
  DashboardKpi,
} from "@/types/dashboard";
import { useEffect, useState } from "react";
import { DashboardCardView } from "app/(app)/components/DashboardCardView";
import {
  DASHBOARD_CARDS,
  type DashboardCardDef,
  type DashboardCardId,
} from "app/(app)/components/DashboardCards";
import {
  DASHBOARD_ENABLED_KEY,
  DASHBOARD_ORDER_KEY,
  loadJson,
  resolveDashboardCardOrder,
} from "app/(app)/components/dashboardPreferences";
import { AutoPrint } from "./AutoPrint";
import { ReportKpiStrip } from "./ReportKpiStrip";

type DashboardLabels = Dictionary["dashboard"];

function reportSizeClass(size?: DashboardCardDef["size"]) {
	if (size === "large" || size === "extraLarge") {
		return "report-card-wide md:col-span-2";
	}

	return "report-card-standard";
}

export function DashboardReport({
  hydration,
  kpis,
  labels,
  aiInsight,
  autoPrint = true,
}: {
  hydration: DashboardHydration;
  kpis: DashboardKpi[];
  labels: DashboardLabels;
  aiInsight: AIInsightPayload;
  autoPrint?: boolean;
}) {
  const [orderedCards, setOrderedCards] = useState<
    DashboardCardDef[]
  >([]);

  const [preferencesReady, setPreferencesReady] =
    useState(false);

  useEffect(() => {
    const savedEnabledIds = loadJson<DashboardCardId[]>(
      DASHBOARD_ENABLED_KEY,
    );

    const enabledIds =
      savedEnabledIds && savedEnabledIds.length
        ? savedEnabledIds.filter((id) =>
            DASHBOARD_CARDS.some(
              (definition) => definition.id === id,
            ),
          )
        : DASHBOARD_CARDS
            .filter((definition) => definition.defaultEnabled)
            .map((definition) => definition.id);

    const enabledDefinitions = DASHBOARD_CARDS.filter(
      (definition) => enabledIds.includes(definition.id),
    );

    const availableIds = enabledDefinitions.map(
      (definition) => definition.id,
    );

    const savedOrder = loadJson<DashboardCardId[]>(
      DASHBOARD_ORDER_KEY,
    );

    const orderedIds = resolveDashboardCardOrder(
      availableIds,
      savedOrder,
    );

    const definitionsById = new Map(
      enabledDefinitions.map((definition) => [
        definition.id,
        definition,
      ]),
    );

    setOrderedCards(
      orderedIds
        .map((id) => definitionsById.get(id))
        .filter(
          (
            definition,
          ): definition is DashboardCardDef =>
            Boolean(definition),
        ),
    );

    setPreferencesReady(true);
  }, []);

  return (
    <div className="space-y-6">
      <ReportKpiStrip
        kpis={kpis}
        labels={labels.kpis}
      />

      {preferencesReady ? (
        <section
          className="report-card-grid grid grid-cols-1 gap-5 md:grid-cols-2"
          aria-label="Dashboard report details"
        >
          {orderedCards.map((definition) => (
            <div
              key={definition.id}
              className={reportSizeClass(definition.size)}
            >
              <DashboardCardView
                definition={definition}
                hydrationCards={hydration.cards}
                labels={labels}
                aiInsight={aiInsight}
                variant="report"
              />
            </div>
          ))}
        </section>
      ) : (
        <div className="flex min-h-48 items-center justify-center text-sm text-slate-500">
          Preparing your report…
        </div>
      )}

      <AutoPrint
        ready={preferencesReady}
        enabled={autoPrint}
      />
    </div>
  );
}