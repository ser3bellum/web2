"use client";

import { useMemo, useState } from "react";

import type { DailyReportDoc } from "@/lib/reports/types";

type HistoryContentProps = {
	reports: DailyReportDoc[];
};

export default function HistoryContent({
	reports,
}: HistoryContentProps) {
	const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
	const [activeReportId, setActiveReportId] = useState<string>(
		reports[0]?.reportId ?? "",
	);

	const activeReport = useMemo(
		() =>
			reports.find(
				(report) => report.reportId === activeReportId,
			) ?? reports[0],
		[activeReportId, reports],
	);

	function toggleReport(reportId: string) {
		setSelectedReportIds((current) =>
			current.includes(reportId)
				? current.filter((id) => id !== reportId)
				: [...current, reportId],
		);
	}
    function printSelectedReports() {
	if (selectedReportIds.length === 0) {
		return;
	}

	const ids = encodeURIComponent(
		selectedReportIds.join(","),
	);

	window.open(
		`/history-print?ids=${ids}`,
		"_blank",
		"noopener,noreferrer",
	);
}

		return (
	<section className="mt-8">
		{/* History status */}
		<div className="mb-7 rounded-2xl border border-blue-100 bg-white px-6 py-5 shadow-sm">
			<div className="flex items-start gap-4">
				<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50">
					<HistoryTrendIcon />
				</div>

				<div>
					<p className="text-sm font-semibold text-slate-900">
						{reports.length === 1
							? "Your business history has started"
							: `${reports.length} reports in your business history`}
					</p>

					<p className="mt-1 text-sm leading-6 text-slate-500">
						{reports.length === 1
							? "Your first daily report is ready. As more reports are generated, Ser3bellum will help you follow how your business changes over time."
							: "Review your previous reports to follow changes in your business over time."}
					</p>
				</div>
			</div>
		</div>

		{/* Reports toolbar */}
		<div className="mb-4 flex min-h-10 items-center justify-between gap-4">
			<div>
				<h2 className="text-base font-semibold text-slate-900">
					Reports
				</h2>

				<p className="mt-0.5 text-xs text-slate-500">
					{reports.length} {reports.length === 1 ? "report" : "reports"}
				</p>
			</div>

			<button
	            type="button"
	            onClick={printSelectedReports}
	            disabled={selectedReportIds.length === 0}
	            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
				<PrintIcon />
				Print selected
				{selectedReportIds.length > 0 && (
					<span className="text-slate-400">
						({selectedReportIds.length})
					</span>
				)}
			</button>
		</div>

		<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
			{/* Report list */}
			<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
				{reports.map((report, index) => {
					const isSelected =
						selectedReportIds.includes(report.reportId);

					const isActive =
						activeReport?.reportId === report.reportId;

					return (
						<article
							key={report.reportId}
							className={`transition ${
								index !== 0
									? "border-t border-slate-100"
									: ""
							} ${
								isActive
									? "bg-blue-50/40"
									: "bg-white hover:bg-slate-50/70"
							}`}
						>
							<div className="flex items-start gap-4 px-5 py-4">
								<input
									type="checkbox"
									checked={isSelected}
									onChange={() =>
										toggleReport(report.reportId)
									}
									aria-label={`Select report ${report.period.to}`}
									className="mt-3 h-4 w-4 shrink-0 rounded border-slate-300"
								/>

								<div className="mt-1 shrink-0 text-blue-500">
									<ReportDocumentIcon />
								</div>

								<button
									type="button"
									onClick={() =>
										setActiveReportId(report.reportId)
									}
									className="min-w-0 flex-1 text-left"
								>
									<div className="flex items-start justify-between gap-5">
										<div className="min-w-0">
											<div className="flex items-center gap-2">
												<p className="text-sm font-semibold text-slate-900">
													Daily report
												</p>

												{isActive && (
													<span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600">
														Previewing
													</span>
												)}
											</div>

											<h3 className="mt-1 truncate text-sm font-medium text-slate-700">
												{report.headline}
											</h3>

											<p className="mt-1 line-clamp-1 text-sm text-slate-500">
												{report.summary}
											</p>
										</div>

										<time className="shrink-0 pt-0.5 text-sm text-slate-500">
											{formatReportDate(report.period.to)}
										</time>
									</div>
								</button>
							</div>
						</article>
					);
				})}
			</div>

				{/* Preview */}
				{activeReport && (
					<aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6">
						<p className="text-xs font-medium uppercase tracking-wide text-slate-400">
							Report preview
						</p>

						<p className="mt-3 text-sm font-medium text-slate-500">
	                        {formatReportDate(activeReport.period.to)}
                        </p>

						<h2 className="mt-2 text-lg font-semibold leading-6 text-slate-900">
							{activeReport.headline}
						</h2>

						<p className="mt-3 text-sm leading-6 text-slate-600">
							{activeReport.summary}
						</p>

						{activeReport.insight?.recommendedAction && (
							<div className="mt-5 border-t border-slate-100 pt-4">
								<p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
									Recommended action
								</p>

								<p className="mt-2 text-sm leading-6 text-slate-600">
									{activeReport.insight.recommendedAction}
								</p>
							</div>
						)}
					</aside>
				)}
			</div>
		</section>
	);
}
    function formatReportDate(date: string) {
	const parsed = new Date(`${date}T00:00:00`);

	return new Intl.DateTimeFormat("en", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(parsed);
}

function ReportDocumentIcon() {
	return (
		<svg
			width="22"
			height="22"
			viewBox="0 0 24 24"
			fill="none"
			aria-hidden="true"
		>
			<path
				d="M7 3.75h6.25L17.5 8v12.25H7V3.75Z"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinejoin="round"
			/>
			<path
				d="M13 3.75V8h4.25M9.5 12h5M9.5 15h5"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function HistoryTrendIcon() {
	return (
		<svg
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			aria-hidden="true"
			className="text-blue-600"
		>
			<path
				d="M5 16l4-4 3 3 6-7"
				stroke="currentColor"
				strokeWidth="1.7"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M14 8h4v4"
				stroke="currentColor"
				strokeWidth="1.7"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function PrintIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			aria-hidden="true"
		>
			<path
				d="M7 9V4h10v5M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"
				stroke="currentColor"
				strokeWidth="1.7"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M7 14h10v6H7v-6Z"
				stroke="currentColor"
				strokeWidth="1.7"
				strokeLinejoin="round"
			/>
		</svg>
	);
}