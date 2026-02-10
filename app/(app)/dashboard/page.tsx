// app/(app)/dashboard/page.tsx
import type { ReactNode } from "react";
import React from "react";

import { Card } from "app/(app)/components/Card";
import { DASHBOARD_CARDS } from "app/(app)/components/DashboardCards";
import { SortableDashboardGrid } from "app/(app)/components/SortableDashboardGrid";
import DashboardCardsGrid from "app/(app)/components/DashboardCardsGrid";


import { KpiStrip } from "./KpiStrip";
import { parseDashboardRange } from "app/(app)/lib/dateRange";
import { getDashboardKpis } from "app/(app)/dashboard/dashboardKpis"; // or "./dashboardKpis" depending on your filename

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;

  const range = parseDashboardRange(sp);
  const kpis = await getDashboardKpis(range);


  return (
    <div className="flex flex-col">


      <div className="flex flex-col gap-6 px-4 pb-8 pt-6 lg:px-8">
        {/* KPI strip (interactive + modal) */}
        <KpiStrip kpis={kpis} />

        {/* 9-card grid */}
        <section>
  <DashboardCardsGrid />
</section>

      </div>
    </div>
  );
}

function renderIconSafe(icon: unknown): ReactNode {
  if (!icon) return null;
  if (typeof icon === "object") return icon as ReactNode;

  if (typeof icon === "function") {
    const Icon = icon as React.ComponentType<{ className?: string }>;
    return <Icon className="h-4 w-4 opacity-70" />;
  }

  if (typeof icon === "string") {
    return <span className="rounded-md border px-2 py-1 text-xs opacity-70">{icon}</span>;
  }

  return null;
}
