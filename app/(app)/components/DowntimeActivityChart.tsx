"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/app/(app)/lib/cn";

type DowntimeDatum = {
  label: string;
  uptime: number;
};

type DowntimeActivityChartProps = {
  currentStatus?: string;
  uptime?: number;
  incidents?: number;
  downtimeMinutes?: number;
  series?: DowntimeDatum[];
  preview?: boolean;
  animate?: boolean;
  className?: string;
};

const EMPTY_SERIES: DowntimeDatum[] = [
  { label: "Mon", uptime: 0 },
  { label: "Tue", uptime: 0 },
  { label: "Wed", uptime: 0 },
  { label: "Thu", uptime: 0 },
  { label: "Fri", uptime: 0 },
  { label: "Sat", uptime: 0 },
  { label: "Sun", uptime: 0 },
];

export function DowntimeActivityChart({
  currentStatus = "No monitoring data",
  uptime = 0,
  incidents = 0,
  downtimeMinutes = 0,
  series = [],
  preview = false,
  animate = true,
  className,
}: DowntimeActivityChartProps) {
  const data = useMemo(
    () => (series.length ? series : EMPTY_SERIES),
    [series],
  );

  return (
    <div
      className={cn(
        "flex h-full min-w-0 flex-col gap-5",
        className,
      )}
    >
      <div className="grid grid-cols-2 gap-x-5 gap-y-3">
        <Metric
          label="Current status"
          value={currentStatus}
          preview={preview}
          compact
        />

        <Metric
          label="Uptime"
          value={`${uptime.toFixed(2)}%`}
          preview={preview}
        />

        <Metric
          label="Incidents"
          value={String(incidents)}
          preview={preview}
        />

        <Metric
          label="Downtime"
          value={`${downtimeMinutes} min`}
          preview={preview}
        />
      </div>

      <div className="h-[175px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 8,
              right: 8,
              left: -18,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient
                id="downtimeAreaFill"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={preview ? "#cbd5e1" : "#416bd7"}
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor={preview ? "#e2e8f0" : "#416bd7"}
                  stopOpacity={0.03}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e2e8f0"
            />

            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 11,
                fill: preview ? "#cbd5e1" : "#64748b",
              }}
            />

            <YAxis
              domain={preview ? [0, 100] : [95, 100]}
              ticks={preview ? [0, 25, 50, 75, 100] : [95, 97, 99, 100]}
              tickFormatter={(value) => `${value}%`}
              axisLine={false}
              tickLine={false}
              width={42}
              tick={{
                fontSize: 10,
                fill: preview ? "#cbd5e1" : "#94a3b8",
              }}
            />

            {!preview ? (
              <Tooltip
                content={<DowntimeTooltip />}
                cursor={{
                  stroke: "#cbd5e1",
                  strokeDasharray: "3 3",
                }}
              />
            ) : null}

            <Area
              type="monotone"
              dataKey="uptime"
              stroke={preview ? "#cbd5e1" : "#416bd7"}
              strokeWidth={2}
              fill="url(#downtimeAreaFill)"
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={!preview && animate}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  preview,
  compact = false,
}: {
  label: string;
  value: string;
  preview: boolean;
  compact?: boolean;
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
          "mt-0.5 font-semibold",
          compact ? "text-sm" : "text-lg",
          preview ? "text-slate-300" : "text-slate-900",
        )}
      >
        {value}
      </div>
    </div>
  );
}

type TooltipPayloadItem = {
  payload?: DowntimeDatum;
};

function DowntimeTooltip({
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
        {item.uptime.toFixed(2)}% uptime
      </div>
    </div>
  );
}