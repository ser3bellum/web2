"use client";

import type { HistoryReport } from "../types";

type HistoryListItemProps = {
	report: HistoryReport;
	selected: boolean;
	onSelect: (id: string, checked: boolean) => void;
	onOpen: (id: string) => void;
};

export function HistoryListItem({
	report,
	selected,
	onSelect,
	onOpen,
}: HistoryListItemProps) {
	return (
		<div
			className={[
				"group flex items-center gap-4 border-b border-slate-200/70 px-4 py-4 transition",
				selected ? "bg-blue-50/45" : "hover:bg-white/35",
			].join(" ")}
		>
			<input
				type="checkbox"
				checked={selected}
				onChange={(event) =>
					onSelect(report.id, event.target.checked)
				}
				aria-label={`Select ${report.title} from ${report.date}`}
				className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30"
			/>

			<div className="flex h-9 w-7 shrink-0 items-center justify-center text-blue-400">
				<DocumentIcon />
			</div>

			<button
				type="button"
				onClick={() => onOpen(report.id)}
				className="min-w-0 flex-1 text-left"
			>
				<div className="flex flex-wrap items-center gap-2">
					<span className="text-xs text-slate-400">
						{report.date}
					</span>

					{report.isLatest ? (
						<span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600">
							Latest
						</span>
					) : null}
				</div>

				<div className="mt-0.5 text-sm font-semibold text-slate-800">
					{report.title}
				</div>

				<p className="mt-0.5 truncate text-sm text-slate-500">
					{report.summary}
				</p>
			</button>

			<button
				type="button"
				onClick={() => onOpen(report.id)}
				aria-label={`Open ${report.title}`}
				className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/60 hover:text-slate-700"
			>
				<ChevronRightIcon />
			</button>
		</div>
	);
}

function DocumentIcon() {
	return (
		<svg
			width="22"
			height="22"
			viewBox="0 0 24 24"
			fill="none"
			aria-hidden="true"
		>
			<path
				d="M7 3h7l4 4v14H7V3z"
				stroke="currentColor"
				strokeWidth="1.7"
				strokeLinejoin="round"
			/>
			<path
				d="M14 3v5h5M10 12h5M10 16h5"
				stroke="currentColor"
				strokeWidth="1.7"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function ChevronRightIcon() {
	return (
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			aria-hidden="true"
		>
			<path
				d="m9 6 6 6-6 6"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}