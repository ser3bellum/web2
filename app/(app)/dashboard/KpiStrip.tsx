"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "app/(app)/components/Card";
import { BaseModal } from "app/(app)/components/ui/Modal";
import type { AnalyticsModalPayload } from "@/lib/analytics/types";
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

type ComparisonPanelProps = {
  title: string;
  currentLabel: string;
  previousLabel: string;
  currentValue: number;
  previousValue: number;
  format?: "number" | "percent";
};

function formatMetricValue(value: number, format: "number" | "percent" = "number") {
  if (format === "percent") {
    return `${value.toFixed(1).replace(".", ",")} %`;
  }
  return value.toLocaleString("fr-FR");
}

function ComparisonPanel({
  title,
  currentLabel,
  previousLabel,
  currentValue,
  previousValue,
  format = "number",
}: ComparisonPanelProps) {
  const max = Math.max(currentValue, previousValue, 1);
  const currentWidth = `${(currentValue / max) * 100}%`;
  const previousWidth = `${(previousValue / max) * 100}%`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-4">
        <div className="text-sm font-medium text-slate-900">{title}</div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="mb-1 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500">{currentLabel}</span>
            <span className="text-sm font-semibold text-slate-900">
              {formatMetricValue(currentValue, format)}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all"
              style={{ width: currentWidth }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500">{previousLabel}</span>
            <span className="text-sm font-semibold text-slate-900">
              {formatMetricValue(previousValue, format)}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-sky-400 transition-all"
              style={{ width: previousWidth }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function KpiStrip({
  kpis,
  labels,
}: {
  kpis: DashboardKpi[];
  labels: KpiLabels;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] =
    useState<AnalyticsModalPayload | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  const activeKpi = useMemo(
    () => kpis.find((k) => k.id === activeId) ?? null,
    [activeId, kpis]
  );

    useEffect(() => {
    if (activeId !== "kpi-analytics") return;

    let cancelled = false;

    async function loadAnalyticsModal() {
      try {
        setAnalyticsLoading(true);
        setAnalyticsError(null);

        const params = new URLSearchParams(window.location.search);
        const from = params.get("from");
        const to = params.get("to");

        const url = new URL("/api/analytics/modal", window.location.origin);

        if (from) {
          url.searchParams.set("from", from);
        }

        if (to) {
          url.searchParams.set("to", to);
        }

        const res = await fetch(url.toString(), {
          cache: "no-store",
        });

        if (!res.ok) {
          let message = "Failed to load analytics details";

          try {
            const errorJson = (await res.json()) as { error?: string; details?: string };
            message = errorJson.error || errorJson.details || message;
          } catch {
            // ignore JSON parse errors and keep fallback message
          }

          throw new Error(message);
        }

        const json = (await res.json()) as AnalyticsModalPayload;

        if (!cancelled) {
          setAnalyticsData(json);
        }
      } catch (error) {
        if (!cancelled) {
          setAnalyticsError(
            error instanceof Error
              ? error.message
              : "Failed to load analytics details"
          );
          setAnalyticsData(null);
        }
      } finally {
        if (!cancelled) {
          setAnalyticsLoading(false);
        }
      }
    }

    void loadAnalyticsModal();

    return () => {
      cancelled = true;
    };
  }, [activeId]);

  function handleClose() {
    setActiveId(null);
    setAnalyticsData(null);
    setAnalyticsError(null);
    setAnalyticsLoading(false);
  }

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
          onClose={handleClose}
          size="xl"
          footer={
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
            >
              {labels.modal.close}
            </button>
          }
        >
          {activeKpi.id === "kpi-analytics" ? (
            <div className="grid gap-4">
              <p className="text-sm text-slate-600">
                {labels.modal.detailsDescription}
              </p>

              {analyticsLoading ? (
                <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
                  Loading analytics…
                </div>
              ) : analyticsError ? (
                <div className="flex h-64 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-sm text-red-600">
                  {analyticsError}
                </div>
              ) : analyticsData ? (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs text-slate-500">Visites</div>
                      <div className="mt-1 text-2xl font-semibold text-slate-900">
                        {analyticsData.totalVisits.toLocaleString("fr-FR")}
                      </div>
                      <div className="mt-1 text-xs text-emerald-600">
                        +{analyticsData.visitsDelta.toFixed(1).replace(".", ",")}%
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs text-slate-500">
                        Page la plus consultée
                      </div>
                      <div
                      className="mt-1 truncate text-lg font-semibold text-slate-900"
                      title={analyticsData.topPage}
                      >
                        {analyticsData.topPage}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs text-slate-500">
                        Taux de rebond
                      </div>
                      <div className="mt-1 text-2xl font-semibold text-slate-900">
                        {analyticsData.bounceRate.toFixed(1).replace(".", ",")} %
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs text-slate-500">
                        Taux d’engagement
                      </div>
                      <div className="mt-1 text-2xl font-semibold text-slate-900">
                        {analyticsData.engagementRate
                          .toFixed(1)
                          .replace(".", ",")}{" "}
                        %
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="mb-4">
                      <div className="text-sm font-medium text-slate-900">
                        Comparaison de période
                      </div>
                      <div className="text-xs text-slate-500">
                        {analyticsData.selectedRangeLabel} vs{" "}
                        {analyticsData.previousRangeLabel}
                      </div>
                    </div>

                    <div className="grid gap-4">
                      <ComparisonPanel
                        title="Visites"
                        currentLabel={analyticsData.selectedRangeLabel}
                        previousLabel={analyticsData.previousRangeLabel}
                        currentValue={analyticsData.comparison.visits.current}
                        previousValue={analyticsData.comparison.visits.previous}
                        format="number"
                      />

                      <ComparisonPanel
                        title="Taux de rebond"
                        currentLabel={analyticsData.selectedRangeLabel}
                        previousLabel={analyticsData.previousRangeLabel}
                        currentValue={analyticsData.comparison.bounceRate.current}
                        previousValue={analyticsData.comparison.bounceRate.previous}
                        format="percent"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
                  No analytics data available.
                </div>
              )}
            </div>
          ) : (
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
          )}
        </BaseModal>
      ) : null}
    </>
  );
}
