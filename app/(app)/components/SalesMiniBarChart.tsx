"use client";

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
    } catch {
      // fallback below
    }
  }

  return new Intl.NumberFormat("fr-FR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function SalesMiniBarChart({
  series,
  height = 180,
  currency,
  className,
}: SalesMiniBarChartProps) {
  const safeSeries = Array.isArray(series) ? series : [];
  const maxValue = Math.max(...safeSeries.map((point) => point.value), 0);
  const hasBars = safeSeries.length > 0 && maxValue > 0;

  if (!safeSeries.length) {
    return (
      <div
        className={["flex items-center justify-center rounded-xl bg-slate-50 text-xs text-slate-400", className]
          .filter(Boolean)
          .join(" ")}
        style={{ height }}
      >
        Pas encore de série de ventes
      </div>
    );
  }

  return (
    <div className={className} style={{ height }}>
      <div className="flex h-full items-end gap-2">
        {safeSeries.map((point, index) => {
          const rawHeight = maxValue > 0 ? (point.value / maxValue) * 100 : 0;
          const barHeight = hasBars
            ? Math.max(rawHeight, point.value > 0 ? 8 : 2)
            : 2;

          const isLast = index === safeSeries.length - 1;

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
    </div>
  );
}