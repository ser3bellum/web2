"use client";

import { useEffect, useMemo, useState } from "react";
import type { DashboardKpi } from "@/types/dashboard";
import {
  DASHBOARD_KPI_DEFINITIONS,
  type DashboardKpiId,
} from "./DashboardKpiDefinitions";
import { KpiStrip } from "./KpiStrip";
import {
  DASHBOARD_MVP_KEY,
  DASHBOARD_MVP_ORDER_KEY,
  loadJson,
  resolveDashboardKpiOrder,
} from "app/(app)/components/dashboardPreferences";

type Props = {
  kpis: DashboardKpi[];
  labels: Parameters<typeof KpiStrip>[0]["labels"];
};

function getZeroStateValue(id: DashboardKpiId): string {
  switch (id) {
    case "kpi-sales":
    case "kpi-finance":
      return "0 €";

    case "kpi-marketing":
      return "0";

    case "kpi-social":
      return "0";

    case "kpi-booking":
      return "0";

    case "kpi-downtime":
      return "0 min";

    case "kpi-crm":
      return "0";

    case "kpi-analytics":
      return "0 users";

    default:
      return "0";
  }
}

export function SelectableKpiStrip({
  kpis,
  labels,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<DashboardKpiId[] | null>(
    null,
  );

  useEffect(() => {
    const syncKpis = () => {
      const availableIds = DASHBOARD_KPI_DEFINITIONS.map(
        (definition) => definition.id,
      );

      const savedSelected =
        loadJson<DashboardKpiId[]>(DASHBOARD_MVP_KEY);

      const savedOrder =
        loadJson<DashboardKpiId[]>(DASHBOARD_MVP_ORDER_KEY);

      const fallbackIds = DASHBOARD_KPI_DEFINITIONS
        .filter((definition) => definition.defaultEnabled)
        .map((definition) => definition.id)
        .slice(0, 5);

      const validSelected = (
        savedSelected?.length ? savedSelected : fallbackIds
      ).filter((id) => availableIds.includes(id));

      const ordered = resolveDashboardKpiOrder(
        validSelected,
        savedOrder,
      ).slice(0, 5);

      setSelectedIds(ordered);
    };

    syncKpis();

    window.addEventListener(
      "sb-dashboard-preferences-updated",
      syncKpis,
    );

    return () => {
      window.removeEventListener(
        "sb-dashboard-preferences-updated",
        syncKpis,
      );
    };
  }, []);

  const visibleKpis = useMemo(() => {
    if (!selectedIds) return [];

    const dataById = new Map(
      kpis.map((kpi) => [kpi.id, kpi]),
    );

    return selectedIds.map((id) => {
      const definition = DASHBOARD_KPI_DEFINITIONS.find(
        (item) => item.id === id,
      );

      const hydrated = dataById.get(id);

      if (hydrated) return hydrated;

      return {
  id,
  title: definition?.title ?? id,
  subtitle: definition?.subtitle ?? "",
  value: getZeroStateValue(id),
  isPlaceholder: true,
  } satisfies DashboardKpi;
    });
  }, [kpis, selectedIds]);

  if (!selectedIds) {
    return null;
  }

  return (
    <KpiStrip
      kpis={visibleKpis}
      labels={labels}
    />
  );
}