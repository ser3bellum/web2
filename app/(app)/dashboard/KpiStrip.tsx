"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "app/(app)/components/Card";
import { BaseModal } from "app/(app)/components/ui/Modal";
import type { AnalyticsModalPayload } from "@/lib/analytics/types";
import { SalesMiniBarChart } from "app/(app)/components/SalesMiniBarChart";
import { MarketingConversionsChart } from "app/(app)/components/MarketingConversionsChart";
import { SocialMediaChart } from "app/(app)/components/SocialMediaChart";
import { AccountingBalanceBreakdown } from "app/(app)/components/AccountingBalanceBreakdown";
import { DowntimeActivityChart } from "app/(app)/components/DowntimeActivityChart";
import { BookingActivityChart } from "app/(app)/components/BookingActivityChart";
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

type CrmPipelineStage = {
  label: string;
  value: number;
};

type CrmSalesTarget = {
  label: string;
  current: number;
  target: number;
};

function CrmPipelinePanel({
  stages,
}: {
  stages: CrmPipelineStage[];
}) {
  const maxValue = Math.max(
    ...stages.map((stage) => stage.value),
    1,
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-4">
        <div className="text-sm font-medium text-slate-900">
          Pipeline
        </div>

        <div className="text-xs text-slate-500">
          Opportunities by stage
        </div>
      </div>

      <div className="space-y-4">
        {stages.map((stage) => {
          const width =
            stage.value > 0
              ? `${Math.max((stage.value / maxValue) * 100, 4)}%`
              : "0%";

          return (
            <div key={stage.label}>
              <div className="mb-1 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  {stage.label}
                </span>

                <span className="text-sm font-semibold text-slate-900">
                  {stage.value.toLocaleString("fr-FR")}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CrmSalesTargetsPanel({
  targets,
  currency,
}: {
  targets: CrmSalesTarget[];
  currency: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-4">
        <div className="text-sm font-medium text-slate-900">
          Sales targets
        </div>

        <div className="text-xs text-slate-500">
          Performance by product family
        </div>
      </div>

      <div className="space-y-5">
        {targets.map((target) => {
          const percentage =
            target.target > 0
              ? Math.min((target.current / target.target) * 100, 100)
              : 0;

          return (
            <div key={target.label}>
              <div className="mb-1 flex items-center justify-between gap-4">
                <span className="text-xs font-medium text-slate-700">
                  {target.label}
                </span>

                <span className="text-xs text-slate-500">
                  {formatMetricValue(
                    target.current,
                    "currency",
                    currency,
                  )}{" "}
                  /{" "}
                  {formatMetricValue(
                    target.target,
                    "currency",
                    currency,
                  )}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <span className="w-9 text-right text-xs font-semibold text-slate-700">
                  {Math.round(percentage)}%
                </span>
              </div>
            </div>
          );
        })}
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
               <div
                className={[
                "text-2xl font-semibold leading-none",
                 kpi.isPlaceholder
                 ? "text-slate-400"
               : "text-slate-900",
               ].join(" ")}
                >
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
                   ) : activeKpi.id === "kpi-crm" ? (
            <div className="grid gap-4">
  <p className="text-sm text-slate-600">
    {labels.modal.detailsDescription}
  </p>

  {/* KPI summary */}
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs text-slate-500">
        Pipeline value
      </div>

      <div className="mt-1 text-2xl font-semibold text-slate-900">
        {formatMetricValue(
          typeof activeKpi.meta?.pipelineValue === "number"
            ? activeKpi.meta.pipelineValue
            : 0,
          "currency",
          typeof activeKpi.meta?.currency === "string"
            ? activeKpi.meta.currency
            : "EUR",
        )}
      </div>
    </div>

    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs text-slate-500">
        Opportunities
      </div>

      <div className="mt-1 text-2xl font-semibold text-slate-900">
        {typeof activeKpi.meta?.opportunities === "number"
          ? activeKpi.meta.opportunities.toLocaleString("fr-FR")
          : "0"}
      </div>
    </div>

    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs text-slate-500">
        Qualified leads
      </div>

      <div className="mt-1 text-2xl font-semibold text-slate-900">
        {typeof activeKpi.meta?.qualifiedLeads === "number"
          ? activeKpi.meta.qualifiedLeads.toLocaleString("fr-FR")
          : "0"}
      </div>
    </div>

    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs text-slate-500">
        Win rate
      </div>

      <div className="mt-1 text-2xl font-semibold text-slate-900">
        {typeof activeKpi.meta?.winRate === "number"
          ? `${activeKpi.meta.winRate.toFixed(1)}%`
          : "0%"}
      </div>
    </div>
  </div>

  {/* CRM detail */}
  <div className="grid gap-4 xl:grid-cols-2">
    <CrmPipelinePanel
      stages={
        Array.isArray(activeKpi.meta?.stages) &&
        activeKpi.meta.stages.length > 0
          ? activeKpi.meta.stages
          : [
              { label: "Leads", value: 0 },
              { label: "Qualified", value: 0 },
              { label: "Opportunity", value: 0 },
              { label: "Proposal", value: 0 },
              { label: "Won", value: 0 },
            ]
      }
    />

    <CrmSalesTargetsPanel
      currency={
        typeof activeKpi.meta?.currency === "string"
          ? activeKpi.meta.currency
          : "EUR"
      }
      targets={
        Array.isArray(activeKpi.meta?.salesTargets) &&
        activeKpi.meta.salesTargets.length > 0
          ? activeKpi.meta.salesTargets
          : [
              {
                label: "Product family A",
                current: 0,
                target: 0,
              },
              {
                label: "Product family B",
                current: 0,
                target: 0,
              },
              {
                label: "Product family C",
                current: 0,
                target: 0,
              },
            ]
      }
         />
     </div>
        </div>
                   ) : activeKpi.id === "kpi-marketing" ? (
            <div className="grid gap-4">
              <p className="text-sm text-slate-600">
                {labels.modal.detailsDescription}
              </p>

             {/* KPI summary */}
<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
    <div className="text-xs text-slate-500">
      Conversions
    </div>

    <div className="mt-1 text-2xl font-semibold text-slate-900">
      {typeof activeKpi.meta?.conversions === "number"
        ? activeKpi.meta.conversions.toLocaleString("fr-FR")
        : "0"}
    </div>
  </div>

  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
    <div className="text-xs text-slate-500">
      Conversion rate
    </div>

    <div className="mt-1 text-2xl font-semibold text-slate-900">
      {typeof activeKpi.meta?.conversionRate === "number"
        ? `${activeKpi.meta.conversionRate.toFixed(1)}%`
        : "0%"}
    </div>
  </div>

  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
    <div className="text-xs text-slate-500">
      Active campaigns
    </div>

    <div className="mt-1 text-2xl font-semibold text-slate-900">
      {typeof activeKpi.meta?.activeCampaigns === "number"
        ? activeKpi.meta.activeCampaigns.toLocaleString("fr-FR")
        : "0"}
    </div>
  </div>

  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
    <div className="text-xs text-slate-500">
      Cost / conversion
    </div>

    <div className="mt-1 text-2xl font-semibold text-slate-900">
      {formatMetricValue(
        typeof activeKpi.meta?.costPerConversion === "number"
          ? activeKpi.meta.costPerConversion
          : 0,
        "currency",
        typeof activeKpi.meta?.currency === "string"
          ? activeKpi.meta.currency
          : "EUR",
      )}
    </div>
  </div>
</div>

{/* Marketing detail */}
<div className="grid gap-4 xl:grid-cols-2">
  {/* Left: same visual language as dashboard card */}
  <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
    <div className="mb-2">
      <div className="text-sm font-medium text-slate-900">
        Conversions by channel
      </div>

      <div className="text-xs text-slate-500">
        Share of conversions across connected channels
      </div>
    </div>

    <MarketingConversionsChart
      series={
        Array.isArray(activeKpi.meta?.series)
          ? activeKpi.meta.series
          : []
      }
      preview={
        !Array.isArray(activeKpi.meta?.series) ||
        activeKpi.meta.series.length === 0
      }
      animate
      className="min-h-[250px]"
    />
  </div>

  {/* Right: expanded information */}
  <div className="rounded-2xl border border-slate-200 bg-white p-4">
    <div className="mb-4">
      <div className="text-sm font-medium text-slate-900">
        Channel performance
      </div>

      <div className="text-xs text-slate-500">
        Spend and efficiency by channel
      </div>
    </div>

    <div className="space-y-5">
      {/* Google Ads */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-slate-900">
            Google Ads
          </span>

          <span className="text-xs font-semibold text-slate-700">
            {typeof activeKpi.meta?.googleAdsConversions === "number"
              ? activeKpi.meta.googleAdsConversions
              : 0}{" "}
            conversions
          </span>
        </div>

        <div className="mb-2 grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-slate-500">Spend</div>
            <div className="mt-0.5 font-semibold text-slate-900">
              {formatMetricValue(
                typeof activeKpi.meta?.googleAdsSpend === "number"
                  ? activeKpi.meta.googleAdsSpend
                  : 0,
                "currency",
                typeof activeKpi.meta?.currency === "string"
                  ? activeKpi.meta.currency
                  : "EUR",
              )}
            </div>
          </div>

          <div>
            <div className="text-slate-500">
              Cost / conversion
            </div>
            <div className="mt-0.5 font-semibold text-slate-900">
              {formatMetricValue(
                typeof activeKpi.meta?.googleAdsCostPerConversion ===
                  "number"
                  ? activeKpi.meta.googleAdsCostPerConversion
                  : 0,
                "currency",
                typeof activeKpi.meta?.currency === "string"
                  ? activeKpi.meta.currency
                  : "EUR",
              )}
            </div>
          </div>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{
              width: `${
                typeof activeKpi.meta?.googleAdsShare === "number"
                  ? Math.min(
                      Math.max(activeKpi.meta.googleAdsShare, 0),
                      100,
                    )
                  : 0
              }%`,
            }}
          />
        </div>
      </div>

      {/* Meta Ads */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-slate-900">
            Meta Ads
          </span>

          <span className="text-xs font-semibold text-slate-700">
            {typeof activeKpi.meta?.metaAdsConversions === "number"
              ? activeKpi.meta.metaAdsConversions
              : 0}{" "}
            conversions
          </span>
        </div>

        <div className="mb-2 grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-slate-500">Spend</div>
            <div className="mt-0.5 font-semibold text-slate-900">
              {formatMetricValue(
                typeof activeKpi.meta?.metaAdsSpend === "number"
                  ? activeKpi.meta.metaAdsSpend
                  : 0,
                "currency",
                typeof activeKpi.meta?.currency === "string"
                  ? activeKpi.meta.currency
                  : "EUR",
              )}
            </div>
          </div>

          <div>
            <div className="text-slate-500">
              Cost / conversion
            </div>
            <div className="mt-0.5 font-semibold text-slate-900">
              {formatMetricValue(
                typeof activeKpi.meta?.metaAdsCostPerConversion ===
                  "number"
                  ? activeKpi.meta.metaAdsCostPerConversion
                  : 0,
                "currency",
                typeof activeKpi.meta?.currency === "string"
                  ? activeKpi.meta.currency
                  : "EUR",
              )}
            </div>
          </div>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{
              width: `${
                typeof activeKpi.meta?.metaAdsShare === "number"
                  ? Math.min(
                      Math.max(activeKpi.meta.metaAdsShare, 0),
                      100,
                    )
                  : 0
              }%`,
            }}
          />
        </div>
      </div>

      {/* Brevo */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-slate-900">
            Brevo
          </span>

          <span className="text-xs font-semibold text-slate-700">
            {typeof activeKpi.meta?.brevoConversions === "number"
              ? activeKpi.meta.brevoConversions
              : 0}{" "}
            conversions
          </span>
        </div>

        <div className="mb-2 grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-slate-500">Emails sent</div>
            <div className="mt-0.5 font-semibold text-slate-900">
              {typeof activeKpi.meta?.brevoSent === "number"
                ? activeKpi.meta.brevoSent.toLocaleString("fr-FR")
                : "0"}
            </div>
          </div>

          <div>
            <div className="text-slate-500">Click rate</div>
            <div className="mt-0.5 font-semibold text-slate-900">
              {typeof activeKpi.meta?.brevoClickRate === "number"
                ? `${activeKpi.meta.brevoClickRate.toFixed(1)}%`
                : "0%"}
            </div>
          </div>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{
              width: `${
                typeof activeKpi.meta?.brevoClickRate === "number"
                  ? Math.min(
                      Math.max(activeKpi.meta.brevoClickRate, 0),
                      100,
                    )
                  : 0
              }%`,
            }}
          />
        </div>
      </div>
    </div>
  </div>
</div>
            </div>
          ) : activeKpi.id === "kpi-social" ? (
  <div className="grid gap-4">
    <p className="text-sm text-slate-600">
      {labels.modal.detailsDescription}
    </p>

    {/* KPI summary */}
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-xs text-slate-500">
          Reach
        </div>

        <div className="mt-1 text-2xl font-semibold text-slate-900">
          {typeof activeKpi.meta?.reach === "number"
            ? activeKpi.meta.reach.toLocaleString("fr-FR")
            : "0"}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-xs text-slate-500">
          Engagements
        </div>

        <div className="mt-1 text-2xl font-semibold text-slate-900">
          {typeof activeKpi.meta?.engagements === "number"
            ? activeKpi.meta.engagements.toLocaleString("fr-FR")
            : "0"}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-xs text-slate-500">
          Engagement rate
        </div>

        <div className="mt-1 text-2xl font-semibold text-slate-900">
          {typeof activeKpi.meta?.engagementRate === "number"
            ? `${activeKpi.meta.engagementRate.toFixed(1)}%`
            : "0%"}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-xs text-slate-500">
          Followers
        </div>

        <div className="mt-1 text-2xl font-semibold text-slate-900">
          {typeof activeKpi.meta?.followers === "number"
            ? activeKpi.meta.followers.toLocaleString("fr-FR")
            : "0"}
        </div>
      </div>
    </div>

    {/* Social detail */}
    <div className="grid gap-4 xl:grid-cols-2">
      {/* Left: same visual as dashboard card */}
      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-2">
          <div className="text-sm font-medium text-slate-900">
            Engagement by platform
          </div>

          <div className="text-xs text-slate-500">
            Share of engagement across social platforms
          </div>
        </div>

        <SocialMediaChart
          series={
            Array.isArray(activeKpi.meta?.series)
              ? activeKpi.meta.series
              : []
          }
          reach={
            typeof activeKpi.meta?.reach === "number"
              ? activeKpi.meta.reach
              : 0
          }
          engagementRate={
            typeof activeKpi.meta?.engagementRate === "number"
              ? activeKpi.meta.engagementRate
              : 0
          }
          preview={
            !Array.isArray(activeKpi.meta?.series) ||
            activeKpi.meta.series.length === 0
          }
          animate
          className="min-h-[250px]"
        />
      </div>

      {/* Right: expanded platform detail */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-4">
          <div className="text-sm font-medium text-slate-900">
            Platform performance
          </div>

          <div className="text-xs text-slate-500">
            Reach and engagement by platform
          </div>
        </div>

        <div className="space-y-6">
          {/* Instagram */}
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-900">
                Instagram
              </span>

              <span className="text-xs font-semibold text-slate-700">
                {typeof activeKpi.meta?.instagramEngagementRate ===
                "number"
                  ? `${activeKpi.meta.instagramEngagementRate.toFixed(1)}%`
                  : "0%"}{" "}
                engagement rate
              </span>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-slate-500">
                  Reach
                </div>

                <div className="mt-0.5 font-semibold text-slate-900">
                  {typeof activeKpi.meta?.instagramReach === "number"
                    ? activeKpi.meta.instagramReach.toLocaleString(
                        "fr-FR",
                      )
                    : "0"}
                </div>
              </div>

              <div>
                <div className="text-slate-500">
                  Engagements
                </div>

                <div className="mt-0.5 font-semibold text-slate-900">
                  {typeof activeKpi.meta?.instagramEngagements ===
                  "number"
                    ? activeKpi.meta.instagramEngagements.toLocaleString(
                        "fr-FR",
                      )
                    : "0"}
                </div>
              </div>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{
                  width: `${
                    typeof activeKpi.meta
                      ?.instagramEngagementRate === "number"
                      ? Math.min(
                          Math.max(
                            activeKpi.meta.instagramEngagementRate,
                            0,
                          ),
                          100,
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          {/* Facebook */}
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-900">
                Facebook
              </span>

              <span className="text-xs font-semibold text-slate-700">
                {typeof activeKpi.meta?.facebookEngagementRate ===
                "number"
                  ? `${activeKpi.meta.facebookEngagementRate.toFixed(1)}%`
                  : "0%"}{" "}
                engagement rate
              </span>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-slate-500">
                  Reach
                </div>

                <div className="mt-0.5 font-semibold text-slate-900">
                  {typeof activeKpi.meta?.facebookReach === "number"
                    ? activeKpi.meta.facebookReach.toLocaleString(
                        "fr-FR",
                      )
                    : "0"}
                </div>
              </div>

              <div>
                <div className="text-slate-500">
                  Engagements
                </div>

                <div className="mt-0.5 font-semibold text-slate-900">
                  {typeof activeKpi.meta?.facebookEngagements ===
                  "number"
                    ? activeKpi.meta.facebookEngagements.toLocaleString(
                        "fr-FR",
                      )
                    : "0"}
                </div>
              </div>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{
                  width: `${
                    typeof activeKpi.meta
                      ?.facebookEngagementRate === "number"
                      ? Math.min(
                          Math.max(
                            activeKpi.meta.facebookEngagementRate,
                            0,
                          ),
                          100,
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  ) : activeKpi.id === "kpi-finance" ? (
  <div className="grid gap-4">
    <p className="text-sm text-slate-600">
      {labels.modal.detailsDescription}
    </p>

    {/* KPI summary */}
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-xs text-slate-500">
          Net balance
        </div>

        <div className="mt-1 text-2xl font-semibold text-slate-900">
          {formatMetricValue(
            typeof activeKpi.meta?.net === "number"
              ? activeKpi.meta.net
              : 0,
            "currency",
            typeof activeKpi.meta?.currency === "string"
              ? activeKpi.meta.currency
              : "EUR",
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-xs text-slate-500">
          Payments received
        </div>

        <div className="mt-1 text-2xl font-semibold text-slate-900">
          {formatMetricValue(
            typeof activeKpi.meta?.paymentsReceived === "number"
              ? activeKpi.meta.paymentsReceived
              : 0,
            "currency",
            typeof activeKpi.meta?.currency === "string"
              ? activeKpi.meta.currency
              : "EUR",
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-xs text-slate-500">
          Refunds
        </div>

        <div className="mt-1 text-2xl font-semibold text-slate-900">
          {formatMetricValue(
            typeof activeKpi.meta?.refunds === "number"
              ? activeKpi.meta.refunds
              : 0,
            "currency",
            typeof activeKpi.meta?.currency === "string"
              ? activeKpi.meta.currency
              : "EUR",
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-xs text-slate-500">
          Fees
        </div>

        <div className="mt-1 text-2xl font-semibold text-slate-900">
          {formatMetricValue(
            typeof activeKpi.meta?.fees === "number"
              ? activeKpi.meta.fees
              : 0,
            "currency",
            typeof activeKpi.meta?.currency === "string"
              ? activeKpi.meta.currency
              : "EUR",
          )}
        </div>
      </div>
    </div>

    {/* Finance detail */}
    <div className="grid gap-4 xl:grid-cols-2">
      {/* Left: same visual language as Finance card */}
      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
        <div>
          <div className="text-sm font-medium text-slate-900">
            Balance overview
          </div>

          <div className="text-xs text-slate-500">
            Available and pending funds
          </div>
        </div>

        <AccountingBalanceBreakdown
          availableBalance={
            typeof activeKpi.meta?.availableBalance === "number"
              ? activeKpi.meta.availableBalance
              : 0
          }
          pendingBalance={
            typeof activeKpi.meta?.pendingBalance === "number"
              ? activeKpi.meta.pendingBalance
              : 0
          }
          fees={
            typeof activeKpi.meta?.fees === "number"
              ? activeKpi.meta.fees
              : 0
          }
          net={
            typeof activeKpi.meta?.net === "number"
              ? activeKpi.meta.net
              : 0
          }
          currency={
            typeof activeKpi.meta?.currency === "string"
              ? activeKpi.meta.currency
              : "EUR"
          }
        />
      </div>

      {/* Right: expanded financial activity */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-4">
          <div className="text-sm font-medium text-slate-900">
            Financial activity
          </div>

          <div className="text-xs text-slate-500">
            Money movement for the selected period
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <div className="mb-1 flex items-center justify-between gap-4">
              <span className="text-xs text-slate-500">
                Payments received
              </span>

              <span className="text-sm font-semibold text-slate-900">
                {formatMetricValue(
                  typeof activeKpi.meta?.paymentsReceived === "number"
                    ? activeKpi.meta.paymentsReceived
                    : 0,
                  "currency",
                  typeof activeKpi.meta?.currency === "string"
                    ? activeKpi.meta.currency
                    : "EUR",
                )}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{
                  width: `${
                    typeof activeKpi.meta?.paymentsShare === "number"
                      ? Math.min(
                          Math.max(activeKpi.meta.paymentsShare, 0),
                          100,
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between gap-4">
              <span className="text-xs text-slate-500">
                Refunds
              </span>

              <span className="text-sm font-semibold text-slate-900">
                {formatMetricValue(
                  typeof activeKpi.meta?.refunds === "number"
                    ? activeKpi.meta.refunds
                    : 0,
                  "currency",
                  typeof activeKpi.meta?.currency === "string"
                    ? activeKpi.meta.currency
                    : "EUR",
                )}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{
                  width: `${
                    typeof activeKpi.meta?.refundsShare === "number"
                      ? Math.min(
                          Math.max(activeKpi.meta.refundsShare, 0),
                          100,
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between gap-4">
              <span className="text-xs text-slate-500">
                Fees
              </span>

              <span className="text-sm font-semibold text-slate-900">
                {formatMetricValue(
                  typeof activeKpi.meta?.fees === "number"
                    ? activeKpi.meta.fees
                    : 0,
                  "currency",
                  typeof activeKpi.meta?.currency === "string"
                    ? activeKpi.meta.currency
                    : "EUR",
                )}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{
                  width: `${
                    typeof activeKpi.meta?.feesShare === "number"
                      ? Math.min(
                          Math.max(activeKpi.meta.feesShare, 0),
                          100,
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="text-xs text-slate-500">
              Net cash flow
            </div>

            <div className="mt-1 text-lg font-semibold text-slate-900">
              {formatMetricValue(
                typeof activeKpi.meta?.netCashFlow === "number"
                  ? activeKpi.meta.netCashFlow
                  : 0,
                "currency",
                typeof activeKpi.meta?.currency === "string"
                  ? activeKpi.meta.currency
                  : "EUR",
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

) : activeKpi.id === "kpi-booking" ? (
  <div className="grid gap-4">
    <p className="text-sm text-slate-600">
      {labels.modal.detailsDescription}
    </p>

    {/* KPI summary */}
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-xs text-slate-500">
          Bookings
        </div>

        <div className="mt-1 text-2xl font-semibold text-slate-900">
          {typeof activeKpi.meta?.totalBookings === "number"
            ? activeKpi.meta.totalBookings.toLocaleString("fr-FR")
            : "0"}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-xs text-slate-500">
          Upcoming
        </div>

        <div className="mt-1 text-2xl font-semibold text-slate-900">
          {typeof activeKpi.meta?.upcomingBookings === "number"
            ? activeKpi.meta.upcomingBookings.toLocaleString("fr-FR")
            : "0"}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-xs text-slate-500">
          Cancellation rate
        </div>

        <div className="mt-1 text-2xl font-semibold text-slate-900">
          {typeof activeKpi.meta?.cancellationRate === "number"
            ? `${activeKpi.meta.cancellationRate.toFixed(0)}%`
            : "0%"}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-xs text-slate-500">
          No-show rate
        </div>

        <div className="mt-1 text-2xl font-semibold text-slate-900">
          {typeof activeKpi.meta?.noShowRate === "number"
            ? `${activeKpi.meta.noShowRate.toFixed(0)}%`
            : "0%"}
        </div>
      </div>
    </div>

    {/* Booking detail */}
    <div className="grid gap-4 xl:grid-cols-2">
      {/* Left: expanded dashboard visualization */}
      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-4">
          <div className="text-sm font-medium text-slate-900">
            Booking activity
          </div>

          <div className="text-xs text-slate-500">
            Reservations across the selected period
          </div>
        </div>

        <BookingActivityChart
          totalBookings={
            typeof activeKpi.meta?.totalBookings === "number"
              ? activeKpi.meta.totalBookings
              : 0
          }
          upcomingBookings={
            typeof activeKpi.meta?.upcomingBookings === "number"
              ? activeKpi.meta.upcomingBookings
              : 0
          }
          cancellationRate={
            typeof activeKpi.meta?.cancellationRate === "number"
              ? activeKpi.meta.cancellationRate
              : 0
          }
          noShowRate={
            typeof activeKpi.meta?.noShowRate === "number"
              ? activeKpi.meta.noShowRate
              : 0
          }
          series={
            Array.isArray(activeKpi.meta?.series)
              ? activeKpi.meta.series
              : []
          }
          preview={
            !Array.isArray(activeKpi.meta?.series) ||
            activeKpi.meta.series.length === 0
          }
          animate
          showMetrics={false}
          className="min-h-[220px]"
        />
      </div>

      {/* Right: status breakdown */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-4">
          <div className="text-sm font-medium text-slate-900">
            Booking status
          </div>

          <div className="text-xs text-slate-500">
            Breakdown for the selected period
          </div>
        </div>

        <div className="space-y-5">
          {[
            {
              label: "Confirmed",
              value:
                typeof activeKpi.meta?.confirmedBookings === "number"
                  ? activeKpi.meta.confirmedBookings
                  : 0,
            },
            {
              label: "Completed",
              value:
                typeof activeKpi.meta?.completedBookings === "number"
                  ? activeKpi.meta.completedBookings
                  : 0,
            },
            {
              label: "Cancelled",
              value:
                typeof activeKpi.meta?.cancelledBookings === "number"
                  ? activeKpi.meta.cancelledBookings
                  : 0,
            },
            {
              label: "No-show",
              value:
                typeof activeKpi.meta?.noShowBookings === "number"
                  ? activeKpi.meta.noShowBookings
                  : 0,
            },
          ].map((item) => {
            const total =
              typeof activeKpi.meta?.totalBookings === "number"
                ? activeKpi.meta.totalBookings
                : 0;

            const percentage =
              total > 0
                ? Math.min(
                    Math.max((item.value / total) * 100, 0),
                    100,
                  )
                : 0;

            return (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between gap-4">
                  <span className="text-xs text-slate-500">
                    {item.label}
                  </span>

                  <span className="text-sm font-semibold text-slate-900">
                    {item.value.toLocaleString("fr-FR")}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
                );
              })}
            </div>
           </div>
          </div>
         </div>
          ) : activeKpi.id === "kpi-downtime" ? (
  <div className="grid gap-4">
    <p className="text-sm text-slate-600">
      {labels.modal.detailsDescription}
    </p>

    {/* KPI summary */}
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-xs text-slate-500">
          Current status
        </div>

        <div className="mt-1 text-lg font-semibold text-slate-900">
          {typeof activeKpi.meta?.currentStatus === "string"
            ? activeKpi.meta.currentStatus
            : "No monitoring data"}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-xs text-slate-500">
          Uptime
        </div>

        <div className="mt-1 text-2xl font-semibold text-slate-900">
          {typeof activeKpi.meta?.uptime === "number"
            ? `${activeKpi.meta.uptime.toFixed(2)}%`
            : "0.00%"}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-xs text-slate-500">
          Incidents
        </div>

        <div className="mt-1 text-2xl font-semibold text-slate-900">
          {typeof activeKpi.meta?.incidents === "number"
            ? activeKpi.meta.incidents.toLocaleString("fr-FR")
            : "0"}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-xs text-slate-500">
          Downtime
        </div>

        <div className="mt-1 text-2xl font-semibold text-slate-900">
          {typeof activeKpi.meta?.downtimeMinutes === "number"
            ? `${activeKpi.meta.downtimeMinutes} min`
            : "0 min"}
        </div>
      </div>
    </div>

    {/* Downtime detail */}
    <div className="grid gap-4 xl:grid-cols-2">
      {/* Left: expanded dashboard visualization */}
      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-4">
          <div className="text-sm font-medium text-slate-900">
            Uptime activity
          </div>

          <div className="text-xs text-slate-500">
            Website availability across the selected period
          </div>
        </div>

        <DowntimeActivityChart
          currentStatus={
            typeof activeKpi.meta?.currentStatus === "string"
              ? activeKpi.meta.currentStatus
              : "No monitoring data"
          }
          uptime={
            typeof activeKpi.meta?.uptime === "number"
              ? activeKpi.meta.uptime
              : 0
          }
          incidents={
            typeof activeKpi.meta?.incidents === "number"
              ? activeKpi.meta.incidents
              : 0
          }
          downtimeMinutes={
            typeof activeKpi.meta?.downtimeMinutes === "number"
              ? activeKpi.meta.downtimeMinutes
              : 0
          }
          series={
            Array.isArray(activeKpi.meta?.series)
              ? activeKpi.meta.series
              : []
          }
          preview={
            !Array.isArray(activeKpi.meta?.series) ||
            activeKpi.meta.series.length === 0
          }
          animate
          showMetrics={false}
          className="min-h-[220px]"
        />
      </div>

      {/* Right: incident information */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-4">
          <div className="text-sm font-medium text-slate-900">
            Incident overview
          </div>

          <div className="text-xs text-slate-500">
            Availability issues for the selected period
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <div className="text-xs text-slate-500">
              Last incident
            </div>

            <div className="mt-1 text-sm font-semibold text-slate-900">
              {typeof activeKpi.meta?.lastIncident === "string"
                ? activeKpi.meta.lastIncident
                : "No incidents recorded"}
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between gap-4">
              <span className="text-xs text-slate-500">
                Incidents
              </span>

              <span className="text-sm font-semibold text-slate-900">
                {typeof activeKpi.meta?.incidents === "number"
                  ? activeKpi.meta.incidents.toLocaleString("fr-FR")
                  : "0"}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{
                  width: `${
                    typeof activeKpi.meta?.incidentShare === "number"
                      ? Math.min(
                          Math.max(activeKpi.meta.incidentShare, 0),
                          100,
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between gap-4">
              <span className="text-xs text-slate-500">
                Total downtime
              </span>

              <span className="text-sm font-semibold text-slate-900">
                {typeof activeKpi.meta?.downtimeMinutes === "number"
                  ? `${activeKpi.meta.downtimeMinutes} min`
                  : "0 min"}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{
                  width: `${
                    typeof activeKpi.meta?.downtimeShare === "number"
                      ? Math.min(
                          Math.max(activeKpi.meta.downtimeShare, 0),
                          100,
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="text-xs text-slate-500">
              Availability
            </div>

            <div className="mt-1 text-lg font-semibold text-slate-900">
              {typeof activeKpi.meta?.uptime === "number"
                ? `${activeKpi.meta.uptime.toFixed(2)}%`
                : "0.00%"}
            </div>
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
