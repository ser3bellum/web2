"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/app/(app)/lib/cn";

type PipelineStage = {
  label: string;
  value: number;
};

type CrmPipelineChartProps = {
  pipelineValue?: number;
  opportunities?: number;
  qualifiedLeads?: number;
  winRate?: number;
  stages?: PipelineStage[];
  currency?: string;
  preview?: boolean;
  animate?: boolean;
  className?: string;
};

const EMPTY_STAGES: PipelineStage[] = [
  { label: "Leads", value: 0 },
  { label: "Qualified", value: 0 },
  { label: "Opportunity", value: 0 },
  { label: "Proposal", value: 0 },
  { label: "Won", value: 0 },
];

function formatCurrency(value: number, currency = "EUR") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function compact(value: number) {
  return new Intl.NumberFormat("en-GB", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

type StageTickProps = {
  x?: number | string;
  y?: number | string;
  payload?: {
    value?: string | number;
  };
};

function StageTick({ x = 0, y = 0, payload }: StageTickProps) {
  const label = String(payload?.value ?? "");
  const displayLabel =
    label.length > 22 ? `${label.slice(0, 21)}…` : label;

  return (
    <text
      x={Number(x) - 8}
      y={Number(y)}
      dy={3}
      textAnchor="end"
      fill="#64748b"
      fontSize={10}
    >
      <title>{label}</title>
      {displayLabel}
    </text>
  );
}

export function CrmPipelineChart({
  pipelineValue = 0,
  opportunities = 0,
  qualifiedLeads = 0,
  winRate = 0,
  stages = [],
  currency = "EUR",
  preview = false,
  animate = true,
  className,
}: CrmPipelineChartProps) {
  const stageData = useMemo(
    () => (stages.length ? stages : EMPTY_STAGES),
    [stages],
  );

  const chartHeight = Math.max(120, stageData.length * 17);

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-3",
        className,
      )}
    >
      <div className="grid grid-cols-2 gap-x-5 gap-y-2">
        <Metric
          label="Pipeline"
          value={formatCurrency(pipelineValue, currency)}
          preview={preview}
        />

        <Metric
          label="Opportunities"
          value={String(opportunities)}
          preview={preview}
        />

        <Metric
          label="Qualified leads"
          value={String(qualifiedLeads)}
          preview={preview}
        />

        <Metric
          label="Win rate"
          value={`${winRate.toFixed(0)}%`}
          preview={preview}
        />
      </div>

      <div
        className="max-h-[120px] min-w-0 overflow-y-auto"
        tabIndex={0}
        role="region"
        aria-label="Pipeline stages"
      >
        <div
          className="min-w-0"
          style={{ height: chartHeight }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={stageData}
              layout="vertical"
              barCategoryGap="35%"
              margin={{
                top: 0,
                right: 12,
                left: 0,
                bottom: 0,
              }}
            >
              <XAxis
                type="number"
                hide
                allowDecimals={false}
                domain={[
                  0,
                  (maximum: number) => Math.max(1, maximum),
                ]}
              />

              <YAxis
                type="category"
                dataKey="label"
                width={125}
                interval={0}
                tickLine={false}
                axisLine={false}
                tick={<StageTick />}
              />

              {!preview ? (
                <Tooltip
                  content={<CrmTooltip />}
                  cursor={{
                    fill: "rgba(148, 163, 184, 0.06)",
                  }}
                />
              ) : null}

              <Bar
                dataKey="value"
                radius={[0, 5, 5, 0]}
                maxBarSize={10}
                fill={preview ? "#e2e8f0" : "#416bd7"}
                isAnimationActive={!preview && animate}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  preview,
}: {
  label: string;
  value: string;
  preview: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] text-slate-500">
        {label}
      </div>

      <div
        className={cn(
          "mt-0.5 text-base font-semibold",
          preview ? "text-slate-500" : "text-slate-900",
        )}
      >
        {value}
      </div>
    </div>
  );
}

type TooltipPayloadItem = {
  payload?: PipelineStage;
};

function CrmTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload?.length) return null;

  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="rounded-lg border border-black/10 bg-white/95 px-3 py-2 text-xs shadow-sm">
      <div className="font-medium text-zinc-900">
        {item.label}
      </div>

      <div className="text-zinc-600">
        {compact(item.value)}
      </div>
    </div>
  );
}