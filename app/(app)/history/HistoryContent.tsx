"use client";

import { useEffect, useId, useMemo, useState } from "react";

import type { DailyReportDoc } from "@/lib/reports/types";

type HistoryContentProps = {
	reports: DailyReportDoc[];
};
const REPORT_SOURCES = [
	{
		id: "ga_overview",
		name: "Google Analytics",
		domain: "analytics.google.com",
	},
	{
		id: "sales",
		name: "Shopify",
		domain: "shopify.com",
	},
	{
		id: "stripe_sales",
		name: "Stripe",
		domain: "stripe.com",
	},
	{
		id: "google_ads",
		name: "Google Ads",
		domain: "ads.google.com",
	},
	{
		id: "meta_ads",
		name: "Meta Ads",
		domain: "meta.com",
	},
];

export default function HistoryContent({
	reports,
}: HistoryContentProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [timeframe, setTimeframe] = useState("all");
	const [customStartDate, setCustomStartDate] = useState("");
	const [customEndDate, setCustomEndDate] = useState("");
	const [page, setPage] = useState(1);
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
		const pageSize = 10;
		const totalPages = Math.max(
		1,
		Math.ceil(filteredReports.length / pageSize),
	);
		const currentPage = Math.min(page, totalPages);
		const pageStart = (currentPage - 1) * pageSize;

		const paginatedReports = filteredReports.slice(
		pageStart,
		pageStart + pageSize,
		);

		const firstPageNumber = Math.max(
		1,
		Math.min(currentPage - 2, totalPages - 4),
		);
		const pageNumbers = Array.from(
		{ length: Math.min(5, totalPages) },
		(_, index) => firstPageNumber + index,
		);

		const activeReport = useMemo(
		() =>
		paginatedReports.find(
			(report) => report.reportId === activeReportId,
		) ?? paginatedReports[0],
		[activeReportId, paginatedReports],
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
		<HistoryActivityBanner reports={reports} />

							{/* History filters */}
<div className="mb-6 flex flex-wrap items-end gap-3">
    <div className="w-full sm:w-72">
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
            onChange={(event) => {
			setSearchQuery(event.target.value);
			setPage(1);
			}}
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
            onChange={(event) => {
			setTimeframe(event.target.value);
			setPage(1);
			}}
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
                    onChange={(event) => {
					setCustomStartDate(event.target.value);
					setPage(1);
					}}
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
                   onChange={(event) => {
				setCustomEndDate(event.target.value);
				setPage(1);
					}}
                    className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
                />
            </div>
        </>
    )}
	<div className="relative ml-auto">
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


		<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_440px]">
			{/* Report list */}
			<div className="space-y-2 rounded-2xl bg-white/50 p-3">
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
				
				{paginatedReports.map((report) => {
					const isSelected =
						selectedReportIds.includes(report.reportId);

					const isActive =
						activeReport?.reportId === report.reportId;

					return (
						<article
						key={report.reportId}
						className={[
						"rounded-lg border transition-all duration-200",
						isActive
						? "border-blue-300 bg-gradient-to-br from-white to-blue-50 shadow-[0_4px_18px_rgba(59,130,246,0.10)] ring-2 ring-blue-100"
						: "border-white/80 bg-white/90 shadow-sm hover:border-blue-200 hover:bg-white hover:shadow-md",
						].join(" ")}
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

								<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50/70 text-blue-600">
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

				{filteredReports.length > 0 && (
	<div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
		<p role="status" className="text-xs text-slate-500">
			Showing {pageStart + 1}–
			{Math.min(pageStart + pageSize, filteredReports.length)} of{" "}
			{filteredReports.length} reports
		</p>

		<nav
			aria-label="Report pages"
			className="flex flex-wrap items-center gap-1"
		>
			<button
				type="button"
				disabled={currentPage === 1}
				onClick={() => setPage(currentPage - 1)}
				className="h-8 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
			>
				Previous
			</button>

			{pageNumbers.map((pageNumber) => (
				<button
					key={pageNumber}
					type="button"
					aria-label={`Page ${pageNumber}`}
					aria-current={
						currentPage === pageNumber ? "page" : undefined
					}
					onClick={() => setPage(pageNumber)}
					className={`h-8 min-w-8 rounded-lg px-2 text-xs font-medium ${
						currentPage === pageNumber
							? "bg-blue-600 text-white"
							: "text-slate-600 hover:bg-slate-50"
					}`}
				>
					{pageNumber}
				</button>
			))}

			<button
				type="button"
				disabled={currentPage === totalPages}
				onClick={() => setPage(currentPage + 1)}
				className="h-8 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
			>
				Next
			</button>
			</nav>
			</div>
			)}

			</div>

				{/* Preview */}
{activeReport && (
	<aside className="h-fit overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_8px_30px_rgba(30,64,175,0.06)] lg:sticky lg:top-6">
		<div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
			<div className="flex items-center gap-3">
				<div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
					<ReportDocumentIcon />
				</div>

				<div>
					<p className="text-sm font-semibold text-slate-900">
						{formatReportDate(activeReport.period.to)}
					</p>
					<p className="mt-1 text-xs text-slate-500">
						Daily business report
					</p>
				</div>
			</div>

			<button
				type="button"
				onClick={() =>
					window.open(
						`/history-print?ids=${encodeURIComponent(activeReport.reportId)}`,
						"_blank",
						"noopener,noreferrer",
					)
				}
				title="Open report to print or save as PDF"
				className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.7"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
				>
					<path d="M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4" />
				</svg>
				Save as PDF
			</button>
		</div>

		<div className="space-y-4 p-5">
			<div className="rounded-xl bg-gradient-to-br from-blue-50 via-indigo-50/70 to-violet-50 p-5">
				<p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
					AI summary
				</p>

				<h2 className="mt-3 text-lg font-semibold leading-7 tracking-tight text-slate-900">
					{activeReport.headline}
				</h2>

				<p className="mt-3 text-sm leading-6 text-slate-600">
					{activeReport.summary}
				</p>
			</div>

			{activeReport.insight?.recommendedAction && (
				<div className="rounded-xl border border-violet-100 bg-violet-50/40 p-5">
					<p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
						Recommended action
					</p>

					<p className="mt-3 text-sm leading-6 text-slate-700">
						{activeReport.insight.recommendedAction}
					</p>
				</div>
			)}
			<div className="rounded-xl border border-slate-100 bg-white p-4">
	<h3 className="text-sm font-semibold text-slate-900">
		Report sources
	</h3>

	<div className="mt-3 flex flex-wrap gap-2">
		{REPORT_SOURCES.filter((source) => {
			const status =
				activeReport.connectorStatus[
					source.id as keyof typeof activeReport.connectorStatus
				]?.status;

			return (
				activeReport.connectorIds.includes(source.id) &&
				(status === "connected" || status === "degraded")
			);
		}).map((source) => {
			const status =
				activeReport.connectorStatus[
					source.id as keyof typeof activeReport.connectorStatus
				]?.status;

			const hasWarning = status === "degraded";

			return (
				<div
					key={source.id}
					title={
						hasWarning
							? `${source.name}: connection or data warning`
							: source.name
					}
					className="inline-flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2"
				>
					<img
						src={`https://www.google.com/s2/favicons?domain=${source.domain}&sz=64`}
						alt=""
						width={20}
						height={20}
						loading="lazy"
						className="h-5 w-5 shrink-0 object-contain"
					/>

					<span className="text-xs font-medium text-slate-700">
						{source.name}
					</span>

					{hasWarning && (
						<span
							aria-label="Connection or data warning"
							className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700"
						>
							!
						</span>
					)}
				</div>
			);
		})}
	</div>
</div>

		</div>
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
	function HistoryActivityBanner({
	reports,
}: HistoryContentProps) {
	const gradientId = useId();
	const [today, setToday] = useState<Date | null>(null);

	useEffect(() => {
		setToday(new Date());
	}, []);

	const activity = useMemo(() => {
		if (!today) return null;

		const year = today.getFullYear();
		const month = today.getMonth();
		const dayCount = today.getDate();
		const dailyCounts = Array<number>(dayCount).fill(0);

		for (const report of reports) {
			const date = new Date(report.generatedAt);

			if (
				date.getFullYear() === year &&
				date.getMonth() === month &&
				date.getTime() <= today.getTime()
			) {
				dailyCounts[date.getDate() - 1] += 1;
			}
		}

		let total = 0;
		const cumulative = [
			0,
			...dailyCounts.map((count) => {
				total += count;
				return total;
			}),
		];

		const points = cumulative.map((value, index) => ({
			x: 8 + (index / dayCount) * 224,
			y: 62 - (value / Math.max(total, 1)) * 48,
		}));

		const line = points
			.map(
				(point, index) =>
					`${index === 0 ? "M" : "L"} ${point.x} ${point.y}`,
			)
			.join(" ");

		return {
			total,
			line,
			area: `${line} L 232 70 L 8 70 Z`,
			end: points[points.length - 1],
			month: today.toLocaleDateString("en", {
				month: "long",
			}),
		};
	}, [reports, today]);

	return (
		<div className="mb-7 overflow-hidden rounded-2xl border border-blue-100 bg-white px-6 py-5 shadow-sm">
			<div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-start gap-4">
					<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50">
						<HistoryTrendIcon />
					</div>

					<div>
						<p className="text-sm font-semibold text-slate-900">
							{reports.length}{" "}
							{reports.length === 1 ? "report" : "reports"} in
							your business history
						</p>

						<p className="mt-1 text-sm leading-6 text-slate-500">
							Your business story, one report at a time.
						</p>
					</div>
				</div>

				{activity && (
					<div className="w-full shrink-0 sm:w-60">
						<div className="flex items-center justify-between text-xs">
							<span className="font-medium text-slate-500">
								{activity.month} activity
							</span>

							<span className="font-semibold text-blue-600">
								{activity.total}{" "}
								{activity.total === 1 ? "report" : "reports"}
							</span>
						</div>

						<svg
							viewBox="0 0 240 76"
							className="mt-1 h-[76px] w-full"
							role="img"
							aria-label={`${activity.total} reports generated this month; cumulative count from the first of the month to today`}
						>
							<defs>
								<linearGradient
									id={gradientId}
									x1="0"
									y1="0"
									x2="0"
									y2="1"
								>
									<stop
										offset="0%"
										stopColor="#3b82f6"
										stopOpacity="0.22"
									/>
									<stop
										offset="100%"
										stopColor="#3b82f6"
										stopOpacity="0"
									/>
								</linearGradient>
							</defs>

							<path
								d={activity.area}
								fill={`url(#${gradientId})`}
							/>

							<path
								d={activity.line}
								fill="none"
								stroke="#3b82f6"
								strokeWidth="2.5"
								strokeLinecap="round"
								strokeLinejoin="round"
								pathLength={1}
								className="history-line"
							/>

							<circle
								cx={activity.end.x}
								cy={activity.end.y}
								r="7"
								fill="#3b82f6"
								opacity="0.15"
								className="motion-safe:animate-pulse"
							/>

							<circle
								cx={activity.end.x}
								cy={activity.end.y}
								r="3"
								fill="#2563eb"
								stroke="white"
								strokeWidth="1.5"
							/>
						</svg>

						<div className="flex justify-between text-[10px] text-slate-400">
							<span>Month start</span>
							<span>Today</span>
						</div>
					</div>
				)}
			</div>

			<style jsx>{`
				.history-line {
					stroke-dasharray: 1;
					stroke-dashoffset: 0;
					animation: history-draw 1.4s ease-out both;
				}

				@keyframes history-draw {
					from {
						stroke-dashoffset: 1;
					}
					to {
						stroke-dashoffset: 0;
					}
				}

				@media (prefers-reduced-motion: reduce) {
					.history-line {
						animation: none;
					}
				}
			`}</style>
		</div>
	);
}
