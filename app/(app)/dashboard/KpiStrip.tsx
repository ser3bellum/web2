"use client";

import { Card } from "app/(app)/components/Card";
import { BaseModal } from "app/(app)/components/ui/Modal";
import { useMemo, useState } from "react";
import type { DashboardKpi } from "./dashboardKpis";

function toneClass(tone?: "up" | "down" | "neutral") {
  if (tone === "down") return "text-red-600";
  if (tone === "up") return "text-emerald-600";
  return "text-neutral-500";
}

type KpiLabels = {
  items: {
    "kpi-analytics": {
      title: string;
      subtitle: string;
    };
    "kpi-sales": {
      title: string;
      subtitle: string;
    };
    "kpi-marketing": {
      title: string;
      subtitle: string;
    };
    "kpi-downtime": {
      title: string;
      subtitle: string;
    };
    "kpi-cpu-usage": {
      title: string;
      subtitle: string;
    };
  };
  modal: {
    close: string;
    detailsDescription: string;
    totalForPeriod: string;
    delta: string;
    chartPlaceholder: string;
  };
};

export function KpiStrip({
  kpis,
  labels,
}: {
  kpis: DashboardKpi[];
  labels: KpiLabels;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeKpi = useMemo(
    () => kpis.find((k) => k.id === activeId) ?? null,
    [activeId, kpis]
  );

  return (
    <>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((kpi) => {
          const isActive = kpi.id === activeId;
          const tone = toneClass(kpi.delta?.tone);

          const localized = labels.items[kpi.id as keyof KpiLabels["items"]];

          const title = localized?.title ?? kpi.title;
          const subtitle = localized?.subtitle ?? kpi.subtitle;

          return (
            <button
              key={kpi.id}
              type="button"
              onClick={() => setActiveId(kpi.id)}
              className="text-left"
            >
              <Card
                title={title}
                subtitle={subtitle}
                className={[
                  "min-h-[88px]",
                  "cursor-pointer select-none",
                  "transition-all",
                  "hover:-translate-y-[1px] hover:shadow-md",
                  "hover:ring-2 hover:ring-indigo-500/60",
                  isActive ? "ring-2 ring-indigo-500 shadow-md" : "",
                ].join(" ")}
                rightSlot={
                  kpi.delta ? (
                    <span className={["text-xs font-medium", tone].join(" ")}>
                      {kpi.delta.value}
                    </span>
                  ) : null
                }
              >
                <div className="text-2xl font-semibold leading-none">
                  {kpi.value}
                </div>
              </Card>
            </button>
          );
        })}
      </section>

      {activeKpi ? (
        <BaseModal
          title={
            labels.items[activeKpi.id as keyof KpiLabels["items"]]?.title ??
            activeKpi.title
          }
          onClose={() => setActiveId(null)}
          size="xl"
          footer={
            <button
              type="button"
              onClick={() => setActiveId(null)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
            >
              {labels.modal.close}
            </button>
          }
        >
          <div className="grid gap-4">
            <p className="text-sm text-slate-600">
              {labels.modal.detailsDescription}
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs text-slate-500">
                  {labels.modal.totalForPeriod}
                </div>
                <div className="text-2xl font-semibold text-slate-900">
                  {activeKpi.value}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs text-slate-500">
                  {labels.modal.delta}
                </div>
                <div
                  className={[
                    "text-2xl font-semibold",
                    toneClass(activeKpi.delta?.tone),
                  ].join(" ")}
                >
                  {activeKpi.delta?.value ?? "—"}
                </div>
              </div>
            </div>

            <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
              {labels.modal.chartPlaceholder}
            </div>
          </div>
        </BaseModal>
      ) : null}
    </>
  );
}
