"use client";

import type { DailyReportDoc } from "@/lib/reports/types";

export function HistoricalReport({
	report,
}: {
	report: DailyReportDoc;
	
}) {
	return (
		<div className="space-y-6">
			<section className="rounded-2xl border border-slate-200 bg-white p-6">
				<p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
					Business summary
				</p>

				<h2 className="mt-2 text-xl font-semibold text-slate-950">
					{report.headline}
				</h2>

				<p className="mt-3 text-sm leading-6 text-slate-600">
					{report.summary}
				</p>
			</section>

			<ReportSignals report={report} />

			{report.insight && (
				<section className="rounded-2xl border border-slate-200 bg-white p-6">
					<p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
						AI insight
					</p>

					<h2 className="mt-2 text-lg font-semibold text-slate-950">
						{report.insight.headline}
					</h2>

					<p className="mt-3 text-sm leading-6 text-slate-600">
						{report.insight.whyItMatters}
					</p>

					{report.insight.recommendedAction && (
						<div className="mt-5 border-t border-slate-100 pt-4">
							<p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
								Recommended action
							</p>

							<p className="mt-2 text-sm leading-6 text-slate-600">
								{report.insight.recommendedAction}
							</p>
						</div>
					)}
				</section>
			)}

		</div>
	);
}

function ReportSignals({
	report,
}: {
	report: DailyReportDoc;
}) {
	const { signals } = report;

	const items = [
		{
			label: "Revenue",
			value:
				signals.sales?.revenue != null
					? formatCurrency(
							signals.sales.revenue,
							signals.sales.currency ?? "EUR",
						)
					: "—",
		},
		{
			label: "Orders",
			value:
				signals.sales?.orderCount != null
					? String(signals.sales.orderCount)
					: "—",
		},
		{
			label: "Sessions",
			value:
				signals.analytics?.sessions != null
					? String(signals.analytics.sessions)
					: "—",
		},
		{
			label: "Downtime",
			value:
				signals.downtime?.minutes != null
					? `${signals.downtime.minutes} min`
					: "—",
		},
	];

	return (
		<section
			className="grid grid-cols-2 gap-4 md:grid-cols-4"
			aria-label="Historical report signals"
		>
			{items.map((item) => (
				<div
					key={item.label}
					className="rounded-xl border border-slate-200 bg-white p-4"
				>
					<p className="text-xs font-medium text-slate-500">
						{item.label}
					</p>

					<p className="mt-2 text-xl font-semibold text-slate-950">
						{item.value}
					</p>
				</div>
			))}
		</section>
	);
}

function formatCurrency(
	value: number,
	currency: string,
) {
	try {
		return new Intl.NumberFormat("en", {
			style: "currency",
			currency,
			maximumFractionDigits: 2,
		}).format(value);
	} catch {
		return `${value} ${currency}`;
	}
}