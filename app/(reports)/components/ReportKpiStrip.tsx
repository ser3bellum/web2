import type { Dictionary } from "@/lib/i18n/getDictionary";
import type { DashboardKpi } from "@/types/dashboard";
import { Card } from "app/(app)/components/Card";

type KpiLabels = Dictionary["dashboard"]["kpis"];

function toneClass(
  tone?: "up" | "down" | "neutral",
) {
  if (tone === "down") return "text-red-600";
  if (tone === "up") return "text-emerald-600";
  return "text-slate-500";
}

export function ReportKpiStrip({
  kpis,
  labels,
}: {
  kpis: DashboardKpi[];
  labels: KpiLabels;
}) {
  return (
    <section
      className="report-kpi-grid grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
      aria-label="Report overview"
    >
      {kpis.map((kpi) => {
        const localized =
          labels.items[
            kpi.id as keyof KpiLabels["items"]
          ];

        const title = localized?.title ?? kpi.title;
        const subtitle =
          localized?.subtitle ?? kpi.subtitle;

        return (
         <Card
	key={kpi.id}
	data-report-card="true"
	className="report-kpi-card min-h-[88px] !p-3 shadow-none"
>
	<div className="flex items-start justify-between gap-1">
		<h3 className="min-w-0 text-[13px] font-medium leading-4 text-slate-900">
			{title}
		</h3>

		{kpi.delta ? (
			<span
				className={[
					"shrink-0 whitespace-nowrap text-[10px] font-semibold leading-4",
					toneClass(kpi.delta.tone),
				].join(" ")}
			>
				{kpi.delta.value}
			</span>
		) : null}
	</div>

	{subtitle ? (
		<p className="mt-1 text-[10px] font-medium leading-4 text-slate-400">
			{subtitle}
		</p>
	) : null}

	<div className="mt-2 whitespace-nowrap text-[18px] font-semibold leading-5 tracking-tight text-slate-950">
		{kpi.value}
	</div>
</Card>
        );
      })}
    </section>
  );
}