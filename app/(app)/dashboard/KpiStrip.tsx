"use client";

import { useMemo, useState } from "react";
import { Card } from "app/(app)/components/Card";
import type { DashboardKpi } from "./dashboardKpis";

function toneClass(tone?: "up" | "down" | "neutral") {
  if (tone === "down") return "text-red-600";
  if (tone === "up") return "text-emerald-600";
  return "text-neutral-500";
}

export function KpiStrip({ kpis }: { kpis: DashboardKpi[] }) {
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

          return (
            <button
              key={kpi.id}
              type="button"
              onClick={() => setActiveId(kpi.id)}
              className="text-left"
            >
              <Card
                title={kpi.title}
                subtitle={kpi.subtitle}
                className={[
                  "min-h-[88px]",
                  "cursor-pointer select-none",
                  "transition-all",
                  "hover:-translate-y-[1px] hover:shadow-md",
                  "hover:ring-2 hover:ring-indigo-500/60",
                  isActive ? "ring-2 ring-indigo-500 shadow-md" : ""
                ].join(" ")}
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
            </button>
          );
        })}
      </section>

      {/* Modal */}
      {activeKpi ? (
        <SimpleModal title={activeKpi.title} onClose={() => setActiveId(null)}>
          <div className="grid gap-4">
            <p className="text-sm text-muted-foreground">
              Detailed activity for the selected period.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-secondary/60 p-4">
                <div className="text-xs text-muted-foreground">Total for period</div>
                <div className="text-2xl font-semibold">{activeKpi.value}</div>
              </div>

              <div className="rounded-xl bg-secondary/60 p-4">
                <div className="text-xs text-muted-foreground">Delta</div>
                <div className={["text-2xl font-semibold", toneClass(activeKpi.delta?.tone)].join(" ")}>
                  {activeKpi.delta?.value ?? "—"}
                </div>
              </div>
            </div>

            <div className="h-64 rounded-xl border bg-background/50 flex items-center justify-center text-sm text-muted-foreground">
              Chart placeholder (next step)
            </div>
          </div>
        </SimpleModal>
      ) : null}
    </>
  );
}

/** Lightweight modal (no extra deps) */
function SimpleModal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-white/40 backdrop-blur-md backdrop-brightness-105"
      />

      {/* dialog */}
      <div className="absolute left-1/2 top-1/2 w-[min(920px,92vw)] -translate-x-1/2 -translate-y-1/2">
        <div className="relative rounded-2xl bg-background shadow-xl border p-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 h-9 w-9 rounded-full border hover:bg-accent"
            aria-label="Close"
          >
            ✕
          </button>

          <h2 className="text-xl font-semibold mb-4">{title}</h2>
          {children}
        </div>
      </div>
    </div>
  );
}
