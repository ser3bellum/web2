// app/dashboard/page.tsx
import type { ReactNode } from "react";
import React from "react";

import { TopBar } from "@/app/components/TopBar";
import { Card } from "@/app/components/Card";
import { DASHBOARD_CARDS } from "@/app/components/DashboardCards";

import { parseDashboardRange } from "@/lib/dateRange";
import { getDashboardKpis } from "./dashboardKpis";

type SearchParams = {
  from?: string;
  to?: string;
};

export default async function DashboardPage({
  searchParams,
}: {
  // Next can provide this as an object OR as a Promise (newer versions / warnings)
  searchParams: SearchParams | Promise<SearchParams>;
}) {
  // ✅ Works in both cases and keeps TS satisfied
  const sp = await Promise.resolve(searchParams);

  const range = parseDashboardRange(sp);

  // Your getDashboardKpis currently returns the static list, so passing range is fine
  const kpis = await getDashboardKpis(range);

  return (
    <div className="flex flex-col">
      {/* Sticky top bar */}
      <TopBar companyName="Ser3bellum" />

      {/* Page content */}
      <div className="flex flex-col gap-6 px-4 pb-8 pt-6 lg:px-8">
        {/* ✅ Removed DatePickerCard (the big "Date range" panel) */}

        {/* KPI strip */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {kpis.map((kpi) => {
            const tone =
              kpi.delta?.tone === "down"
                ? "text-red-600"
                : kpi.delta?.tone === "up"
                  ? "text-emerald-600"
                  : "text-neutral-500";

            return (
              <Card
                key={kpi.id}
                title={kpi.title}
                subtitle={kpi.subtitle}
                className="min-h-[88px]"
                rightSlot={
                  kpi.delta ? (
                    <span className={["text-xs font-medium", tone].join(" ")}>
                      {kpi.delta.value}
                    </span>
                  ) : null
                }
              >
                <div className="text-2xl font-semibold leading-none">{kpi.value}</div>
              </Card>
            );
          })}
        </section>

        {/* 9-card grid */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {DASHBOARD_CARDS.map((c: any) => (
            <Card
              key={c.id ?? c.key ?? c.title}
              title={c.title}
              subtitle={c.subtitle}
              rightSlot={renderIconSafe(c.icon)}
              className="min-h-[220px]"
            >
              <div className="text-sm opacity-70">
                {c.description ?? "Content coming next step…"}
              </div>
            </Card>
          ))}
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
    return (
      <span className="rounded-md border px-2 py-1 text-xs opacity-70">
        {icon}
      </span>
    );
  }

  return null;
}
