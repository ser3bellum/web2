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

type BookingDatum = {
  label: string;
  bookings: number;
};

type BookingActivityChartProps = {
  totalBookings?: number;
  upcomingBookings?: number;
  cancellationRate?: number;
  noShowRate?: number;
  series?: BookingDatum[];
  preview?: boolean;
  animate?: boolean;
  className?: string;
};

const EMPTY_SERIES: BookingDatum[] = [
  { label: "Mon", bookings: 0 },
  { label: "Tue", bookings: 0 },
  { label: "Wed", bookings: 0 },
  { label: "Thu", bookings: 0 },
  { label: "Fri", bookings: 0 },
  { label: "Sat", bookings: 0 },
  { label: "Sun", bookings: 0 },
];

export function BookingActivityChart({
  totalBookings = 0,
  upcomingBookings = 0,
  cancellationRate = 0,
  noShowRate = 0,
  series = [],
  preview = false,
  animate = true,
  className,
}: BookingActivityChartProps) {
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
          label="Bookings"
          value={String(totalBookings)}
          preview={preview}
        />

        <Metric
          label="Upcoming"
          value={String(upcomingBookings)}
          preview={preview}
        />

        <Metric
          label="Cancellation rate"
          value={`${cancellationRate.toFixed(0)}%`}
          preview={preview}
        />

        <Metric
          label="No-show rate"
          value={`${noShowRate.toFixed(0)}%`}
          preview={preview}
        />
      </div>

      <div className="h-[175px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 8,
              right: 4,
              left: -25,
              bottom: 0,
            }}
          >
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
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 10,
                fill: preview ? "#cbd5e1" : "#94a3b8",
              }}
            />

            {!preview ? (
              <Tooltip
                content={<BookingTooltip />}
                cursor={{
                  fill: "rgba(148, 163, 184, 0.08)",
                }}
              />
            ) : null}

            <Bar
              dataKey="bookings"
              fill={preview ? "#e2e8f0" : "#416bd7"}
              radius={[6, 6, 0, 0]}
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
  payload?: BookingDatum;
};

function BookingTooltip({
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
        {item.bookings} booking
        {item.bookings === 1 ? "" : "s"}
      </div>
    </div>
  );
}