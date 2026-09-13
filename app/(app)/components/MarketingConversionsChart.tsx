"use client";

import { useMemo } from "react";
import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { cn } from "@/app/(app)/lib/cn";

type MarketingChannelDatum = {
  label: string;
  value: number;
};

type MarketingConversionsChartProps = {
  series?: MarketingChannelDatum[];
  className?: string;
  preview?: boolean;
  animate?: boolean;
};

const EMPTY_SERIES: MarketingChannelDatum[] = [
  { label: "Google Ads", value: 0 },
  { label: "Meta Ads", value: 0 },
  { label: "Brevo", value: 0 },
];

export function MarketingConversionsChart({
  series = [],
  className,
  preview = false,
  animate = true,
}: MarketingConversionsChartProps) {
  const data = useMemo(() => {
    const source = series.length ? series : EMPTY_SERIES;

    const total = source.reduce(
      (sum, item) => sum + Math.max(0, item.value),
      0,
    );

    return source.map((item, index) => {
      const percentage =
        total > 0
          ? Math.round((Math.max(0, item.value) / total) * 100)
          : 0;

      return {
        ...item,
        percentage,
        fill: preview
          ? ["#e2e8f0", "#e8edf5", "#eef2f7"][index] ?? "#e2e8f0"
          : ["#416bd7", "#7c8ee8", "#a5b4fc"][index] ?? "#416bd7",
      };
    });
  }, [series, preview]);

  return (
    <div
      className={cn(
        "flex h-full min-w-0 items-center gap-4",
        className,
      )}
    >
      <div className="h-[210px] min-w-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="22%"
            outerRadius="92%"
            startAngle={90}
            endAngle={-270}
            barSize={14}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              tick={false}
              axisLine={false}
            />

            <Tooltip
              content={<MarketingTooltip />}
              cursor={false}
            />

            <RadialBar
              dataKey="percentage"
              background={{
                fill: "#f1f5f9",
              }}
              cornerRadius={999}
              isAnimationActive={!preview && animate}
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>

      <div className="w-[130px] shrink-0 space-y-3">
        {data.map((item) => (
          <div
            key={item.label}
            className={cn(
              "flex items-center justify-between gap-3 text-xs",
              preview ? "text-slate-400" : "text-slate-600",
            )}
          >
            <div className="min-w-0">
              <div className="truncate font-medium">
                {item.label}
              </div>

              <div className="text-[11px] opacity-70">
                {item.value} conversions
              </div>
            </div>

            <div className="font-semibold">
              {item.percentage}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type TooltipPayloadItem = {
  payload?: {
    label: string;
    value: number;
    percentage: number;
  };
};

type MarketingTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadItem[];
};

function MarketingTooltip({
  active,
  payload,
}: MarketingTooltipProps) {
  if (!active || !payload?.length) return null;

  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="rounded-lg border border-black/10 bg-white/95 px-3 py-2 text-xs shadow-sm">
      <div className="font-medium text-zinc-900">
        {item.label}
      </div>

      <div className="text-zinc-600">
        {item.value} conversions
      </div>

      <div className="text-zinc-500">
        {item.percentage}% of total
      </div>
    </div>
  );
}