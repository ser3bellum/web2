"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/app/(app)/lib/cn";

type RangeKey = "7d" | "30d" | "60d";

type Point = {
  t: number;
  label: string;
  value: number;
};

type TopPageDatum = {
  path: string;
  views: number;
};

type AnalyticsSummary = {
  users: number;
  sessions: number;
};

type AnalyticsMiniChartProps = {
  className?: string;
  variant?: "mini" | "horizontal-bars";
  topPages?: TopPageDatum[];
  summary?: AnalyticsSummary;
  series?: Point[];
  allowRangeToggle?: boolean;
  initialRange?: RangeKey;
  showFullSeries?: boolean;
  animate?: boolean;
};

function niceNumber(n: number) {
  return new Intl.NumberFormat("en-GB").format(n);
}

function compactNumber(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(".0", "")}k`;
  return String(n);
}

function filterSeriesByRange(series: Point[], range: RangeKey): Point[] {
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 60;
  return series.slice(-days);
}

export function AnalyticsMiniChart({
  className,
  variant = "mini",
  topPages = [],
  summary,
  series = [],
  allowRangeToggle = true,
  initialRange = "30d",
  showFullSeries = false,
  animate = true,
}: AnalyticsMiniChartProps) {
  const [range, setRange] = useState<RangeKey>(initialRange);
  const [hover, setHover] = useState<Point | null>(null);

  const data = useMemo(
  () => showFullSeries
    ? series
    : filterSeriesByRange(series, range),
  [series, range, showFullSeries],
);
  const hasData = data.length > 0;

  const totalViews = useMemo(
    () => data.reduce((total, point) => total + point.value, 0),
    [data]
  );

  const peak = useMemo(() => Math.max(0, ...data.map((p) => p.value)), [data]);

  const liveValue = hover?.value ?? data[data.length - 1]?.value ?? 0;
  const liveLabel = hover?.label ?? "Today";

  if (variant === "horizontal-bars") {
    const hasTopPages = topPages.length > 0;

    return (
      <div className={cn("h-full w-full", className)}>
        {hasTopPages ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topPages}
              layout="vertical"
              margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              barCategoryGap={18}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#e2e8f0"
              />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickFormatter={compactNumber}
              />
              <YAxis
                type="category"
                dataKey="path"
                tickLine={false}
                axisLine={false}
                width={120}
                tick={{ fontSize: 13, fill: "#0f172a" }}
              />
              <Tooltip
                content={<TopPagesTooltip />}
                cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
              />
              <Bar dataKey="views" radius={[0, 8, 8, 0]} isAnimationActive={animate} >
                {topPages.map((entry) => (
                  <Cell key={entry.path} fill="#7db7e8" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState label="No top pages data yet" />
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex h-full min-w-0 flex-col overflow-hidden", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-semibold leading-none text-zinc-900">
              {niceNumber(liveValue)}
            </div>
            <div className="text-sm text-zinc-500">{liveLabel}</div>
          </div>

          <div className="mt-1 text-xs text-zinc-500">
            Total views {niceNumber(totalViews)} • Peak {niceNumber(peak)}
          </div>
        </div>

        {summary ? (
          <div className="grid grid-cols-2 gap-3 text-right text-xs">
            <div>
              <div className="font-semibold text-zinc-900">
                {niceNumber(summary.users)}
              </div>
              <div className="text-zinc-400">Users</div>
            </div>

            <div>
              <div className="font-semibold text-zinc-900">
                {niceNumber(summary.sessions)}
              </div>
              <div className="text-zinc-400">Sessions</div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-3 h-[170px] min-w-0 overflow-hidden rounded-xl">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 0, left: -8, bottom: 0 }}
              onMouseMove={(state: unknown) => {
                const s = state as
                  | { activePayload?: Array<{ payload?: Point }> }
                  | null;
                const p = s?.activePayload?.[0]?.payload;
                if (p) setHover(p);
              }}
              onMouseLeave={() => setHover(null)}
            >
              <defs>
                <linearGradient
                  id="analyticsGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#416bd7" stopOpacity={0.35} />
                  <stop offset="60%" stopColor="#416bd7" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval={Math.max(0, Math.floor(data.length / 6))}
                minTickGap={24}
              />
              <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
              <Tooltip content={<TooltipBox />} cursor={{ stroke: "#416bd7" }} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#416bd7"
                fill="url(#analyticsGradient)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={animate}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState label="No analytics data yet" />
        )}
      </div>

      {allowRangeToggle ? (
        <div className="mt-1 flex justify-end gap-5 pr-2 text-[11px] font-medium">
          {(["7d", "30d", "60d"] as RangeKey[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setRange(k)}
              className={cn(
                "transition-colors hover:text-slate-500",
                range === k ? "text-indigo-500" : "text-slate-300"
              )}
            >
              {k}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-xl bg-zinc-50 text-sm text-zinc-400">
      {label}
    </div>
  );
}

type TopPagesTooltipPayloadItem = { payload?: TopPageDatum };
type TopPagesTooltipProps = {
  active?: boolean;
  payload?: TopPagesTooltipPayloadItem[];
};

function TopPagesTooltip({ active, payload }: TopPagesTooltipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;

  return (
    <div className="rounded-lg border border-black/10 bg-white/95 px-3 py-2 text-xs shadow-sm">
      <div className="font-medium text-zinc-900">{p.path}</div>
      <div className="text-zinc-600">Views: {niceNumber(p.views)}</div>
    </div>
  );
}

type TooltipPayloadItem = { payload?: Point };
type TooltipProps = { active?: boolean; payload?: TooltipPayloadItem[] };

function TooltipBox({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;

  return (
    <div className="rounded-lg border border-black/10 bg-white/90 px-3 py-2 text-xs shadow-sm">
      <div className="font-medium text-zinc-900">{p.label}</div>
      <div className="text-zinc-600">Views: {niceNumber(p.value)}</div>
    </div>
  );
}