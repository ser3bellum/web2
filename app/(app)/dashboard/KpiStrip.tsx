"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "app/(app)/components/Card";
import { BaseModal } from "app/(app)/components/ui/Modal";
import type { AnalyticsModalPayload } from "@/lib/analytics/types";
import { SalesMiniBarChart } from "app/(app)/components/SalesMiniBarChart";
import type { DashboardKpi } from "@/types/dashboard";

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
  format?: "number" | "percent" | "currency";
  currency?: string;
};

function formatMetricValue(
  value: number,
  format: "number" | "percent" | "currency" = "number",
  currency = "EUR"
) {
  if (format === "percent") {
    return `${value.toFixed(1).replace(".", ",")} %`;
  }

  if (format === "currency") {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
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
  currency = "EUR",
}: ComparisonPanelProps) {
  const max = Math.max(currentValue, previousValue, 1);
  const currentWidth = `${(currentValue / max) * 100}%`;
  const previousWidth = `${(previousValue / max) * 100}%`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-4">
        <div className="text-sm font-medium text-slate-900">{title}</div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="mb-1 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500">{currentLabel}</span>
            <span className="text-sm font-semibold text-slate-900">
              {formatMetricValue(currentValue, format, currency)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
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
              {formatMetricValue(previousValue, format, currency)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
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
            const errorJson = (await res.json()) as {
              error?: string;
              details?: string;
            };
            message = errorJson.error || errorJson.details || message;
          } catch {
            // keep fallback message
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
                subtitleVariant="kpi"
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
        <div className="text-xs text-slate-500">Users</div>

        <div className="mt-1 text-2xl font-semibold text-slate-900">
          {(
            analyticsData.users ??
            0
          ).toLocaleString("fr-FR")}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-xs text-slate-500">Sessions</div>

        <div className="mt-1 text-2xl font-semibold text-slate-900">
          {(analyticsData.sessions ?? 0).toLocaleString("fr-FR")}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-xs text-slate-500">New users</div>

        <div className="mt-1 text-2xl font-semibold text-slate-900">
          {(analyticsData.newUsers ?? 0).toLocaleString("fr-FR")}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-xs text-slate-500">Top page</div>

       <div
  className="mt-1 break-all text-sm font-semibold text-slate-900"
  title={analyticsData.topPage ?? ""}
>
  {analyticsData.topPage
    ?.replace(/^https?:\/\//, "")
    ?.replace(/^www\./, "www.") ?? "—"}
</div>
      </div>
    </div>

    <div className="grid min-w-0 gap-4 xl:grid-cols-[0.8fr_1.2fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-4">
          <div className="text-sm font-medium text-slate-900">
            Top locations
          </div>

          <div className="text-xs text-slate-500">
            Countries with the most users
          </div>
        </div>

        <div className="space-y-3">
          {(analyticsData.topLocations ?? []).length > 0 ? (
            (analyticsData.topLocations ?? [])
              .slice(0, 5)
              .map((location) => (
                <div
                  key={location.country}
                  className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2"
                >
                  <span className="text-sm text-slate-700">
                    {location.country}
                  </span>

                  <span className="text-sm font-semibold text-slate-900">
                    {(location.users ?? 0).toLocaleString("fr-FR")}
                  </span>
                </div>
              ))
          ) : (
            <div className="text-sm text-slate-500">
              No location data yet.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-4">
          <div className="text-sm font-medium text-slate-900">
            Comparaison de période
          </div>

          <div className="text-xs text-slate-500">
            {analyticsData.selectedRangeLabel ?? "Current"} vs{" "}
            {analyticsData.previousRangeLabel ?? "Previous"}
          </div>
        </div>

        <div className="grid gap-4">
          <ComparisonPanel
            title="Users"
            currentLabel={
              analyticsData.selectedRangeLabel ?? "Current"
            }
            previousLabel={
              analyticsData.previousRangeLabel ?? "Previous"
            }
            currentValue={
              analyticsData.comparison?.users?.current ??
              0
            }
            previousValue={
              analyticsData.comparison?.users?.previous ?? 0
            }
            format="number"
          />

          <ComparisonPanel
            title="Sessions"
            currentLabel={
              analyticsData.selectedRangeLabel ?? "Current"
            }
            previousLabel={
              analyticsData.previousRangeLabel ?? "Previous"
            }
            currentValue={
              analyticsData.comparison?.sessions?.current ?? 0
            }
            previousValue={
              analyticsData.comparison?.sessions?.previous ?? 0
            }
            format="number"
          />
        </div>
      </div>
    </div>
  </>
              ) : (
                <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
                  No analytics data available.
                </div>
              )}
            </div>
          ) : activeKpi.id === "kpi-sales" ? (
            <div className="grid gap-4">
              <p className="text-sm text-slate-600">
                {labels.modal.detailsDescription}
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs text-slate-500">Chiffre d’affaires</div>
                  <div className="mt-1 text-2xl font-semibold text-slate-900">
                    {activeKpi.value}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs text-slate-500">Commandes</div>
                  <div className="mt-1 text-2xl font-semibold text-slate-900">
                    {typeof activeKpi.meta?.orderCount === "number"
                      ? activeKpi.meta.orderCount.toLocaleString("fr-FR")
                      : "0"}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs text-slate-500">Panier moyen</div>
                  <div className="mt-1 text-2xl font-semibold text-slate-900">
                    {typeof activeKpi.meta?.averageOrderValue === "number"
                      ? new Intl.NumberFormat("fr-FR", {
                          style: "currency",
                          currency:
                            typeof activeKpi.meta?.currency === "string"
                              ? activeKpi.meta.currency
                              : "EUR",
                          maximumFractionDigits: 0,
                        }).format(activeKpi.meta.averageOrderValue)
                      : "—"}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs text-slate-500">Variation</div>
                  <div
                    className={[
                      "mt-1 text-2xl font-semibold",
                      toneClass(activeKpi.delta?.tone),
                    ].join(" ")}
                  >
                    {activeKpi.delta?.value ?? "—"}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="mb-4">
                    <div className="text-sm font-medium text-slate-900">
                      Comparaison de période
                    </div>
                    <div className="text-xs text-slate-500">
                      Période actuelle vs période précédente
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <ComparisonPanel
                      title="Chiffre d’affaires"
                      currentLabel="Période actuelle"
                      previousLabel="Période précédente"
                      currentValue={
                        typeof activeKpi.meta?.currentRevenue === "number"
                          ? activeKpi.meta.currentRevenue
                          : 0
                      }
                      previousValue={
                        typeof activeKpi.meta?.previousRevenue === "number"
                          ? activeKpi.meta.previousRevenue
                          : 0
                      }
                      format="currency"
                      currency={
                        typeof activeKpi.meta?.currency === "string"
                          ? activeKpi.meta.currency
                          : "EUR"
                      }
                    />

                    <ComparisonPanel
                      title="Commandes"
                      currentLabel="Période actuelle"
                      previousLabel="Période précédente"
                      currentValue={
                        typeof activeKpi.meta?.orderCount === "number"
                          ? activeKpi.meta.orderCount
                          : 0
                      }
                      previousValue={
                        typeof activeKpi.meta?.previousOrderCount === "number"
                          ? activeKpi.meta.previousOrderCount
                          : 0
                      }
                      format="number"
                    />
                  </div>
                </div>

                <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="mb-4">
                    <div className="text-sm font-medium text-slate-900">
                      Ventes par jour
                    </div>
                    <div className="text-xs text-slate-500">
                      Répartition sur la période sélectionnée
                    </div>
                  </div>

                <div className="min-w-0 overflow-x-auto">
              <div className="min-w-[720px]">
              <SalesMiniBarChart
              series={Array.isArray(activeKpi.meta?.series) ? activeKpi.meta.series : []}
              currency={
              typeof activeKpi.meta?.currency === "string"
              ? activeKpi.meta.currency
              : "EUR"
               }
              height={220}
               />
                </div>
            </div>
                </div>
              </div>
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
