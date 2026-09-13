"use client";

import { useMemo } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { cn } from "@/app/(app)/lib/cn";

type SocialPlatformDatum = {
  label: string;
  engagements: number;
};

type SocialMediaChartProps = {
  series?: SocialPlatformDatum[];
  reach?: number;
  engagementRate?: number;
  className?: string;
  preview?: boolean;
  animate?: boolean;
};

const EMPTY_SERIES: SocialPlatformDatum[] = [
  { label: "Instagram", engagements: 0 },
  { label: "Facebook", engagements: 0 },
];

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-GB", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function SocialMediaChart({
  series = [],
  reach = 0,
  engagementRate = 0,
  className,
  preview = false,
  animate = true,
}: SocialMediaChartProps) {
  const data = useMemo(() => {
    const source = series.length ? series : EMPTY_SERIES;

    const totalEngagements = source.reduce(
      (sum, item) => sum + Math.max(0, item.engagements),
      0,
    );

    return {
      totalEngagements,
      series: source.map((item, index) => ({
        ...item,
        percentage:
          totalEngagements > 0
            ? Math.round(
                (Math.max(0, item.engagements) / totalEngagements) * 100,
              )
            : 0,
        fill:
          preview
            ? ["#e2e8f0", "#eef2f7"][index] ?? "#e2e8f0"
            : ["#416bd7", "#8b9cf0"][index] ?? "#416bd7",
      })),
    };
  }, [series, preview]);

  const pieData =
    data.totalEngagements > 0
      ? data.series
      : data.series.map((item) => ({
          ...item,
          engagements: 1,
        }));

  return (
    <div
      className={cn(
        "flex h-full min-w-0 items-center gap-5",
        className,
      )}
    >
      <div className="relative h-[205px] min-w-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="engagements"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={3}
              stroke="transparent"
              isAnimationActive={!preview && animate}
            >
              {pieData.map((entry) => (
                <Cell
                  key={entry.label}
                  fill={entry.fill}
                />
              ))}
            </Pie>

            {!preview && data.totalEngagements > 0 ? (
              <Tooltip content={<SocialTooltip />} />
            ) : null}
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div
            className={cn(
              "text-2xl font-semibold",
              preview ? "text-slate-300" : "text-slate-900",
            )}
          >
            {formatCompact(data.totalEngagements)}
          </div>

          <div
            className={cn(
              "mt-1 text-[11px]",
              preview ? "text-slate-300" : "text-slate-500",
            )}
          >
            engagements
          </div>
        </div>
      </div>

      <div className="w-[145px] shrink-0 space-y-4">
        <Metric
          label="Reach"
          value={formatCompact(reach)}
          preview={preview}
        />

        <Metric
          label="Engagements"
          value={formatCompact(data.totalEngagements)}
          preview={preview}
        />

        <Metric
          label="Engagement rate"
          value={`${engagementRate.toFixed(1)}%`}
          preview={preview}
        />

        <div className="space-y-2 pt-1">
          {data.series.map((item) => (
            <div
              key={item.label}
              className={cn(
                "flex items-center justify-between gap-3 text-[11px]",
                preview ? "text-slate-300" : "text-slate-500",
              )}
            >
              <span className="truncate">{item.label}</span>

              <span className="font-medium">
                {item.percentage}%
              </span>
            </div>
          ))}
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
          preview ? "text-slate-300" : "text-slate-800",
        )}
      >
        {value}
      </div>
    </div>
  );
}

type TooltipPayloadItem = {
  payload?: {
    label: string;
    engagements: number;
    percentage: number;
  };
};

function SocialTooltip({
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
        {item.engagements} engagements
      </div>

      <div className="text-zinc-500">
        {item.percentage}% of total
      </div>
    </div>
  );
}