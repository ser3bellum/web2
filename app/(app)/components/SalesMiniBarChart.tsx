"use client";

import { useMemo, useState } from "react";

type SalesMiniBarChartPoint = {
  label: string;
  value: number;
};

type SalesMiniBarChartProps = {
  series: SalesMiniBarChartPoint[];
  height?: number;
  currency?: string;
  className?: string;
};

const ranges = ["7d", "30d", "60d"] as const;
type ChartRange = (typeof ranges)[number];

function getRangeLimit(range: ChartRange) {
  return range === "7d" ? 7 : range === "30d" ? 30 : 60;
}

function formatCompactValue(value: number, currency?: string): string {
  if (!Number.isFinite(value)) return "0";

  if (currency && currency.trim().length === 3) {
    try {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: currency.toUpperCase(),
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(value);
    } catch {}
  }

  return new Intl.NumberFormat("fr-FR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function SalesMiniBarChart({
  series,
  height = 210,
  currency,
  className,
}: SalesMiniBarChartProps) {
  const [range, setRange] = useState<ChartRange>("30d");

  const safeSeries = Array.isArray(series) ? series : [];

  const visibleSeries = useMemo(() => {
    const limit = getRangeLimit(range);
    return safeSeries.slice(-limit);
  }, [safeSeries, range]);

  const maxValue = Math.max(...visibleSeries.map((point) => point.value), 0);
  const hasBars = visibleSeries.length > 0 && maxValue > 0;

  if (!safeSeries.length) {
    return (
      <div
        className={[
          "flex items-center justify-center rounded-xl bg-slate-50 text-xs text-slate-400",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ height }}
      >
        Pas encore de série de ventes
      </div>
    );
  }

 return (
  <div className={["flex flex-col", className].filter(Boolean).join(" ")} style={{ height }}>
    <div className="flex min-h-0 flex-1 items-end gap-2">
      {visibleSeries.map((point, index) => {
        const rawHeight = maxValue > 0 ? (point.value / maxValue) * 100 : 0;
        const barHeight = hasBars
          ? Math.max(rawHeight, point.value > 0 ? 8 : 2)
          : 2;

        const isLast = index === visibleSeries.length - 1;

        return (
          <div
            key={`${point.label}-${index}`}
            className="flex h-full min-w-0 flex-1 flex-col justify-end"
            title={`${point.label}: ${formatCompactValue(point.value, currency)}`}
          >
            <div className="flex flex-1 items-end">
              <div
                className={[
                  "w-full rounded-t-md transition-all duration-300",
                  isLast ? "bg-indigo-600" : "bg-indigo-500/85",
                ].join(" ")}
                style={{ height: `${barHeight}%` }}
              />
            </div>

            <div className="mt-2 truncate text-center text-[11px] text-slate-500">
              {point.label}
            </div>
          </div>
        );
      })}
    </div>

    <div className="mt-1 flex shrink-0 justify-end gap-5 pr-2 text-[11px] font-medium">
      {ranges.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setRange(item)}
          className={[
            "transition-colors hover:text-slate-500",
            range === item ? "text-indigo-500" : "text-slate-300",
          ].join(" ")}
        >
          {item}
        </button>
      ))}
    </div>
  </div>
);
}