"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type AIInsightTrendPoint = {
  label: string;
  value: number;
};

type AIInsightChartProps = {
  data?: AIInsightTrendPoint[];
  metric?: string;
};

export function AIInsightChart({
  data = [],
  metric = "Trend",
}: AIInsightChartProps) {
  const gradientId = `aiInsightArea-${useId().replace(/:/g, "")}`;
  const validData = data.filter(
    (point) => typeof point.label === "string" && Number.isFinite(point.value),
  );

  return (
    <div className="h-[185px] w-full rounded-2xl border border-white/15 bg-white/[0.08] px-2 pb-2 pt-4">
      <div className="mb-2 flex items-center justify-between px-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
          {metric}
        </p>

        <p className="text-[11px] text-[#9158eeb3]">
          Selected period
        </p>
      </div>

      <div className="h-[135px]">
        {validData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-[#7c3aed]">
            No trend data.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={validData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgba(255,255,255,0.42)" />
                  <stop offset="95%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                minTickGap={28}
                tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 10 }}
              />

              <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />

              <Tooltip
                cursor={{
                  stroke: "rgba(111, 50, 243, 0.18)",
                  strokeDasharray: "4 4",
                }}
                contentStyle={{
                  background: "rgba(65, 48, 105, 0.92)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: "10px",
                  color: "#fff",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "rgba(255,255,255,0.65)" }}
              />

              <Area
                type="monotone"
                dataKey="value"
                name={metric}
                stroke="rgba(255,255,255,0.92)"
                strokeWidth={2.25}
                fill={`url(#${gradientId})`}
                activeDot={{ r: 4, fill: "#fff", strokeWidth: 0 }}
                isAnimationActive
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
