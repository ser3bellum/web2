"use client";

import { useMemo, useState } from "react";

import type { DailyReportDoc } from "@/lib/reports/types";

type HistoryContentProps = {
	reports: DailyReportDoc[];
};

export default function HistoryContent({
	reports,
}: HistoryContentProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [timeframe, setTimeframe] = useState("all");
	const [customStartDate, setCustomStartDate] = useState("");
	const [customEndDate, setCustomEndDate] = useState("");

	const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
	const [isPrintDropdownOpen, setIsPrintDropdownOpen] = useState(false);
	const [activeReportId, setActiveReportId] = useState<string>(
		reports[0]?.reportId ?? "",
	);

	const filteredReports = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const today = new Date();
    const todayString = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0"),
    ].join("-");

    let startDate = "";

    if (["7", "30", "90"].includes(timeframe)) {
        const days = Number(timeframe);
        const start = new Date(today);
        start.setHours(12, 0, 0, 0);
        start.setDate(start.getDate() - (days - 1));

        startDate = [
            start.getFullYear(),
            String(start.getMonth() + 1).padStart(2, "0"),
            String(start.getDate()).padStart(2, "0"),
        ].join("-");
    }

    return reports.filter((report) => {
        const reportDate = report.period.to;

        const matchesTimeframe =
            timeframe === "custom"
                ? (!customStartDate || reportDate >= customStartDate) &&
                  (!customEndDate || reportDate <= customEndDate)
                : timeframe === "all" ||
                  (reportDate >= startDate && reportDate <= todayString);

        const searchableText = [
            report.headline,
            report.summary,
            report.insight?.recommendedAction,
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        return matchesTimeframe && searchableText.includes(query);
    		});
		}, [
    		reports,
    		searchQuery,
   			timeframe,
    		customStartDate,
    		customEndDate,
			]);
	
	const selectedReports = useMemo(
    () =>
        selectedReportIds
            .map((id) =>
                reports.find((report) => report.reportId === id),
            )
            .filter(
                (report): report is DailyReportDoc =>
                    report !== undefined,
            ),
    [selectedReportIds, reports],
);

	const activeReport = useMemo(
    () =>
        filteredReports.find(
            (report) => report.reportId === activeReportId,
        ) ?? filteredReports[0],
    [activeReportId, filteredReports],
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

							{/* History filters */}
<div className="mb-6 flex flex-wrap items-end gap-3">
    <div className="min-w-[220px] flex-1">
        <label
            htmlFor="history-search"
            className="mb-1.5 block text-xs font-medium text-slate-600"
        >
            Search reports
        </label>
        <input
            id="history-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search reports..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
    </div>

    <div className="min-w-[170px]">
        <label
            htmlFor="history-timeframe"
            className="mb-1.5 block text-xs font-medium text-slate-600"
        >
            Timeframe
        </label>
        <select
            id="history-timeframe"
            value={timeframe}
            onChange={(event) => setTimeframe(event.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        >
            <option value="all">All time</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="custom">Custom range</option>
        </select>
    </div>

    {timeframe === "custom" && (
        <>
            <div>
                <label
                    htmlFor="history-start-date"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                >
                    From
                </label>
                <input
                    id="history-start-date"
                    type="date"
                    value={customStartDate}
                    onChange={(event) =>
                        setCustomStartDate(event.target.value)
                    }
                    className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
                />
            </div>

            <div>
                <label
                    htmlFor="history-end-date"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                >
                    To
                </label>
                <input
                    id="history-end-date"
                    type="date"
                    value={customEndDate}
                    onChange={(event) =>
                        setCustomEndDate(event.target.value)
                    }
                    className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
                />
            </div>
        </>
    )}
</div>

		{/* Reports toolbar */}
		<div className="mb-4 flex min-h-10 items-center justify-between gap-4">
			<div>
				<h2 className="text-base font-semibold text-slate-900">
					Reports
				</h2>

				<p className="mt-0.5 text-xs text-slate-500">
					{filteredReports.length} of {reports.length} reports
				</p>
			</div>

			<div className="relative">
    <button
        type="button"
        onClick={() =>
            setIsPrintDropdownOpen((current) => !current)
        }
        disabled={selectedReports.length === 0}
        aria-expanded={isPrintDropdownOpen}
        aria-haspopup="true"
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
        <PrintIcon />
        Print selected ({selectedReports.length})
        <span className="text-xs text-slate-400">▾</span>
   
    </button>

    {isPrintDropdownOpen && selectedReports.length > 0 && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 max-w-[calc(100vw-3rem)] rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Selected reports
            </p>

            <div className="max-h-64 space-y-2 overflow-y-auto">
                {selectedReports.map((report) => (
                    <div
                        key={report.reportId}
                        className="flex items-center gap-3 rounded-lg bg-slate-50 p-3"
                    >
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-700">
                                {formatReportDate(report.period.to)}
                            </p>

                            <p
                                className="mt-1 truncate text-xs text-slate-500"
                                title={report.headline}
                            >
                                {report.headline}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => toggleReport(report.reportId)}
                            aria-label={`Remove report from ${report.period.to}`}
                            title="Remove from selection"
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <button
                    type="button"
                    onClick={() => {
                        setSelectedReportIds([]);
                        setIsPrintDropdownOpen(false);
                    }}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800"
                >
                    Clear all
                </button>

                <button
                    type="button"
                    onClick={() => {
                        printSelectedReports();
                        setIsPrintDropdownOpen(false);
                    }}
                    className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white transition hover:bg-blue-700"
                >
                    <PrintIcon />
                    Print {selectedReports.length}{" "}
                    {selectedReports.length === 1 ? "report" : "reports"}
                </button>
            </div>
        </div>
    )}
</div>
		</div>

		<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
			{/* Report list */}
			<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
				{filteredReports.length === 0 && (
  			  <div className="px-6 py-12 text-center">
        		<p className="text-sm font-semibold text-slate-900">
           		 No matching reports
        		</p>
        		<p className="mt-2 text-sm text-slate-500">
           		 Try a different search term or adjust your timeframe.
       			 </p>
    			</div>
				)}
				
				{filteredReports.map((report, index) => {
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