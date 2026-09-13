"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
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


function formatCurrency(
  value: number,
  currency = "EUR",
) {
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


  return (
    <div
      className={cn(
        "flex h-full min-w-0 flex-col gap-4",
        preview && "text-slate-400",
        className,
      )}
    >
      <div className="grid grid-cols-2 gap-x-5 gap-y-3">
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

      <div className="h-[145px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={stageData}
            layout="vertical"
            margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="#e2e8f0"
            />

            <XAxis
              type="number"
              hide
              domain={[0, "dataMax + 1"]}
            />

            <YAxis
              type="category"
              dataKey="label"
              width={78}
              tickLine={false}
              axisLine={false}
              tick={{
                fontSize: 11,
                fill: preview ? "#cbd5e1" : "#64748b",
              }}
            />

            {!preview ? (
              <Tooltip
                content={<CrmTooltip />}
                cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
              />
            ) : null}

            <Bar
              dataKey="value"
              radius={[0, 8, 8, 0]}
              fill={preview ? "#e2e8f0" : "#416bd7"}
              isAnimationActive={!preview && animate}
            />
          </BarChart>
        </ResponsiveContainer>
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
      <div
        className={cn(
          "text-[11px]",
          preview ? "text-slate-300" : "text-slate-400",
        )}
      >
        {label}
      </div>

      <div
        className={cn(
          "mt-0.5 text-lg font-semibold",
          preview ? "text-slate-300" : "text-slate-900",
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