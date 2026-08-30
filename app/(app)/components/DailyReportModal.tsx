"use client";

import { Portal } from "app/(app)/components/Portal";
import { Activity, AlertTriangle, Cpu, Sparkles, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

export type DailyActivityMetric = {
	label: string;
	value: number;
	displayValue: string;
};

export type DailyHealthMetric = {
	label: string;
	value: number;
	max: number;
	displayValue: string;
	tone: "good" | "warning" | "critical" | "neutral";
};

export type DailyReport = {
	date: string;
	headline: string;
	summary: string;
	summaryLabel: "AI summary" | "Operational summary";
	bullets: string[];
	activity: DailyActivityMetric[];
	health: DailyHealthMetric[];
	reportId: string;
};

type CloseReason = "close" | "view";

function formatGeneratedAt(value: string) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;

	return new Intl.DateTimeFormat(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(date);
}

function signalTone(text: string) {
	const value = text.toLowerCase();
	if (value.includes("downtime") || value.includes("incident") || value.includes("alert")) {
		return "border-rose-200 bg-rose-50 text-rose-800";
	}
	if (value.includes("cpu") || value.includes("system")) {
		return "border-amber-200 bg-amber-50 text-amber-800";
	}
	return "border-sky-200 bg-sky-50 text-sky-800";
}

function healthTone(tone: DailyHealthMetric["tone"]) {
	if (tone === "critical") return "bg-rose-500";
	if (tone === "warning") return "bg-amber-500";
	if (tone === "good") return "bg-emerald-500";
	return "bg-slate-400";
}

export default function DailyReportModal({
	report,
	closing,
	onRequestClose,
	onClosed,
	onPrint,
}: {
	report: DailyReport;
	closing: boolean;
	onRequestClose: (reason: CloseReason) => void;
	onClosed: () => void;
	onPrint: () => void;
}) {
	const titleId = useId();
	const descriptionId = useId();
	const backdropRef = useRef<HTMLDivElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);
	const closeButtonRef = useRef<HTMLButtonElement>(null);
	const previousFocusRef = useRef<HTMLElement | null>(null);

	useEffect(() => {
		previousFocusRef.current = document.activeElement as HTMLElement | null;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		closeButtonRef.current?.focus();

		const panel = panelRef.current;
		const backdrop = backdropRef.current;
		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		if (!reducedMotion) {
			backdrop?.animate([{ opacity: 0 }, { opacity: 1 }], {
				duration: 180,
				easing: "ease-out",
			});
			panel?.animate(
				[
					{ opacity: 0, transform: "translateY(16px) scale(.98)" },
					{ opacity: 1, transform: "translateY(0) scale(1)" },
				],
				{ duration: 260, easing: "cubic-bezier(.2,.8,.2,1)" },
			);
		}

		return () => {
			document.body.style.overflow = previousOverflow;
			previousFocusRef.current?.focus();
		};
	}, []);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				event.preventDefault();
			onRequestClose("close");
				return;
			}

			if (event.key !== "Tab" || !panelRef.current) return;
			const focusable = panelRef.current.querySelectorAll<HTMLElement>(
				'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
			);
			if (!focusable.length) return;

			const first = focusable[0];
			const last = focusable[focusable.length - 1];
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		};

		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [onRequestClose]);

	useEffect(() => {
		if (!closing) return;

		const panel = panelRef.current;
		const backdrop = backdropRef.current;
		if (!panel || !backdrop) {
			onClosed();
			return;
		}

    const panelElement = panel;
    const backdropElement = backdrop;

		let cancelled = false;
		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const target = document.querySelector<HTMLElement>("[data-daily-report-target='true']");


		async function animateOut() {
			
			const backdropAnimation = backdropElement.animate([{ opacity: 1 }, { opacity: 0 }], {
				duration: reducedMotion ? 100 : 280,
				easing: "ease-in",
				fill: "forwards",
			});

			let panelAnimation: Animation;
			if (target && !reducedMotion) {
				const from = panelElement.getBoundingClientRect();
				const to = target.getBoundingClientRect();
				const translateX = to.left + to.width / 2 - (from.left + from.width / 2);
				const translateY = to.top + to.height / 2 - (from.top + from.height / 2);
				const scaleX = Math.max(to.width / from.width, 0.08);
				const scaleY = Math.max(to.height / from.height, 0.08);

				panelAnimation = panelElement.animate(
					[
						{ opacity: 1, transform: "translate(0, 0) scale(1, 1)", borderRadius: "1rem" },
						{
							opacity: 0.12,
							transform: `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`,
							borderRadius: "1rem",
						},
					],
					{ duration: 420, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" },
				);
			} else {
				panelAnimation = panelElement.animate(
					[
						{ opacity: 1, transform: "translateY(0) scale(1)" },
						{ opacity: 0, transform: "translateY(8px) scale(.98)" },
					],
					{ duration: reducedMotion ? 100 : 220, easing: "ease-in", fill: "forwards" },
				);
			}

			await Promise.allSettled([panelAnimation.finished, backdropAnimation.finished]);
			if (!cancelled) onClosed();
		}

		void animateOut();
		return () => {
			cancelled = true;
		};
	}, [closing, onClosed]);

	const maxActivity = Math.max(1, ...report.activity.map((metric) => metric.value));

	return (
		<Portal>
			<div
				ref={backdropRef}
				className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md"
				onMouseDown={(event) => {
					if (event.target === event.currentTarget) onRequestClose("close");
				}}
			>
				<div
					ref={panelRef}
					role="dialog"
					aria-modal="true"
					aria-labelledby={titleId}
					aria-describedby={descriptionId}
					className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-white/70 bg-white shadow-2xl"
				>
					<header className="flex items-start justify-between gap-6 border-b border-slate-200 px-6 py-5 sm:px-8">
						<div>
							<div className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
								<Sparkles className="h-3.5 w-3.5" /> Daily briefing
							</div>
							<h2 id={titleId} className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
								{report.headline}
							</h2>
							<p id={descriptionId} className="mt-2 text-sm text-slate-500">
								Generated {formatGeneratedAt(report.date)}
							</p>
						</div>
						<button
							ref={closeButtonRef}
							type="button"
							onClick={() => onRequestClose("close")}
							aria-label="Close daily briefing"
							className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						>
							<X className="h-4 w-4" />
						</button>
					</header>

					<div className="grid gap-5 px-6 py-6 sm:px-8 lg:grid-cols-[1.15fr_.85fr]">
						<div className="space-y-5">
							<section className="rounded-2xl bg-gradient-to-br from-indigo-50 via-violet-50 to-fuchsia-50 p-5 ring-1 ring-violet-100">
								<div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.14em] text-violet-700">
									<Sparkles className="h-4 w-4" /> {report.summaryLabel}
								</div>
								<p className="mt-3 text-base leading-7 text-slate-800">{report.summary}</p>
							</section>

							<section className="rounded-2xl border border-slate-200 p-5">
								<div className="mb-4 flex items-center justify-between gap-3">
									<h3 className="flex items-center gap-2 font-semibold text-slate-950">
										<Activity className="h-4 w-4 text-indigo-600" /> Latest signals
									</h3>
									<span className="text-xs text-slate-500">{report.bullets.length} detected</span>
								</div>
								<div className="space-y-2.5">
									{report.bullets.map((bullet, index) => (
										<div key={`${bullet}-${index}`} className={`rounded-xl border px-3.5 py-3 text-sm leading-6 ${signalTone(bullet)}`}>
											{bullet}
										</div>
									))}
								</div>
							</section>
						</div>

						<div className="space-y-5">
							<section className="rounded-2xl border border-slate-200 p-5">
								<h3 className="font-semibold text-slate-950">Activity overview</h3>
								{report.activity.length ? (
									<div className="mt-5 space-y-4">
										{report.activity.map((metric) => (
											<div key={metric.label}>
												<div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
													<span className="text-slate-600">{metric.label}</span>
													<span className="font-semibold text-slate-950">{metric.displayValue}</span>
												</div>
												<div className="h-2 overflow-hidden rounded-full bg-slate-100">
													<div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${Math.max(3, (metric.value / maxActivity) * 100)}%` }} />
												</div>
											</div>
										))}
									</div>
								) : (
									<p className="mt-3 text-sm text-slate-500">No activity volume was reported.</p>
								)}
							</section>

							<section className="rounded-2xl border border-slate-200 p-5">
								<h3 className="flex items-center gap-2 font-semibold text-slate-950">
									<Cpu className="h-4 w-4 text-indigo-600" /> System health
								</h3>
								{report.health.length ? (
									<div className="mt-5 space-y-4">
										{report.health.map((metric) => (
											<div key={metric.label}>
												<div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
													<span className="text-slate-600">{metric.label}</span>
													<span className="font-semibold text-slate-950">{metric.displayValue}</span>
												</div>
												<div className="h-2 overflow-hidden rounded-full bg-slate-100">
													<div className={`h-full rounded-full ${healthTone(metric.tone)}`} style={{ width: `${Math.min(100, Math.max(2, (metric.value / Math.max(metric.max, 1)) * 100))}%` }} />
												</div>
											</div>
										))}
									</div>
								) : (
									<div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
										<AlertTriangle className="h-4 w-4" /> No system warnings reported.
									</div>
								)}
							</section>
						</div>
					</div>

					<footer className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 sm:px-8">
						<button type="button" onClick={onPrint} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
							Print
						</button>
						<button type="button" onClick={() => onRequestClose("view")} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700">
							View full report
						</button>
						<button type="button" onClick={() => onRequestClose("close")} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
							Close
						</button>
					</footer>
				</div>
			</div>
		</Portal>
	);
}