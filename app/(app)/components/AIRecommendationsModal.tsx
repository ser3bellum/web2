"use client";

import { useEffect, useState } from "react";
import { Sparkles, Lightbulb, ArrowRight } from "lucide-react";
import { Modal } from "@/app/(app)/components/Modal";

type AIRecommendationsModalProps = {
	open: boolean;
	onClose: () => void;
	headline: string;
	whyItMatters?: string;
	recommendedAction?: string;
	sourceNote?: string;
};

function TypedText({
	text,
	visible,
}: {
	text: string;
	visible: number;
}) {
	const characters = Array.from(text);
	const complete = visible >= characters.length;

	return (
		<>
			{/* Screen readers receive the complete text once. */}
			<span className="sr-only">{text}</span>

			{/* Reserve the full text height to prevent layout shifts. */}
			<span
				aria-hidden="true"
				className="relative grid"
			>
				<span className="invisible col-start-1 row-start-1">
					{text}
				</span>

				<span className="col-start-1 row-start-1">
					{characters.slice(0, visible).join("")}
					{!complete && visible > 0 && (
						<span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-0.5 bg-violet-500 motion-safe:animate-pulse" />
					)}
				</span>
			</span>
		</>
	);
}

function RecommendationContent({
	headline,
	whyItMatters,
	recommendedAction,
	sourceNote,
}: Omit<AIRecommendationsModalProps, "open" | "onClose">) {
	const whyLength = Array.from(whyItMatters ?? "").length;
	const actionLength = Array.from(recommendedAction ?? "").length;
	const totalLength = whyLength + actionLength;

	const [visible, setVisible] = useState(0);
	const [skipped, setSkipped] = useState(false);

	useEffect(() => {
		const preference = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		);

		let frame = 0;
		let startedAt: number | undefined;

		const duration = Math.min(
			2500,
			Math.max(900, totalLength * 5),
		);

		function tick(now: number) {
			if (preference.matches) {
				setVisible(totalLength);
				return;
			}

			startedAt ??= now;

			const progress = Math.min(
				1,
				(now - startedAt) / duration,
			);

			setVisible(Math.floor(progress * totalLength));

			if (progress < 1) {
				frame = requestAnimationFrame(tick);
			}
		}

		if (totalLength > 0) {
			frame = requestAnimationFrame(tick);
		}

		return () => cancelAnimationFrame(frame);
	}, [totalLength]);

	const shown = skipped ? totalLength : visible;
	const complete = shown >= totalLength;

	return (
		<div className="px-2 pb-2">
			<div className="flex items-center gap-3">
				<div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
					<Sparkles className="h-5 w-5" />
				</div>

				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">
						AI Insight
					</p>

					<h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-zinc-900">
						Recommended action
					</h2>
				</div>
			</div>

			<div className="mt-7">
				<p className="text-lg font-semibold leading-7 text-zinc-900">
					{headline}
				</p>
			</div>

			{whyItMatters && (
				<div className="mt-7 border-t border-slate-200 pt-6">
					<p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
						Why it matters
					</p>

					<p className="mt-3 text-sm leading-7 text-zinc-700">
						<TypedText
							text={whyItMatters}
							visible={Math.min(shown, whyLength)}
						/>
					</p>
				</div>
			)}

			{recommendedAction && (
				<div className="mt-6 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 p-5 ring-1 ring-violet-100">
					<div className="flex items-start gap-4">
						<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-violet-700 shadow-sm ring-1 ring-violet-100">
							<Lightbulb className="h-4 w-4" />
						</div>

						<div className="min-w-0 flex-1">
							<p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-600">
								Recommended action
							</p>

							<p className="mt-2 text-base font-semibold leading-7 text-zinc-900">
								<TypedText
									text={recommendedAction}
									visible={Math.max(0, shown - whyLength)}
								/>
							</p>
						</div>
					</div>
				</div>
			)}

			{sourceNote && (
				<div className="mt-6 flex items-center gap-2 text-xs leading-5 text-zinc-500">
					<ArrowRight className="h-3.5 w-3.5 shrink-0" />
					<span>{sourceNote}</span>
				</div>
			)}

			{totalLength > 0 && (
				<div className="mt-3 flex min-h-6 justify-end">
					<button
						type="button"
						onClick={() => setSkipped(true)}
						disabled={complete}
						className={[
							"rounded text-xs font-medium text-violet-600",
							"hover:text-violet-800",
							"focus-visible:outline focus-visible:outline-2",
							"focus-visible:outline-offset-4",
							complete ? "invisible" : "",
						].join(" ")}
					>
						Show full text
					</button>
				</div>
			)}
		</div>
	);
}

export function AIRecommendationsModal({
	open,
	onClose,
	headline,
	whyItMatters,
	recommendedAction,
	sourceNote,
}: AIRecommendationsModalProps) {
	return (
		<Modal open={open} onClose={onClose} size="lg" showClose>
			{open && (
				<RecommendationContent
					key={JSON.stringify([
						headline,
						whyItMatters,
						recommendedAction,
					])}
					headline={headline}
					whyItMatters={whyItMatters}
					recommendedAction={recommendedAction}
					sourceNote={sourceNote}
				/>
			)}
		</Modal>
	);
}