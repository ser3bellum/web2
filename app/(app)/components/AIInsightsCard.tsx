import type * as React from "react";
import { useState } from "react";

import { ArrowRight, Sparkles } from "lucide-react";
import type { AIInsightStatus } from "@/types/ai";
import {
	AIInsightChart,
	type AIInsightTrendPoint,
} from "./AIInsightChart";
import { AIRecommendationsModal } from "./AIRecommendationsModal";

type AIInsightsCardProps = React.HTMLAttributes<HTMLDivElement> & {
	status?: AIInsightStatus;
	title?: string;
	headline?: string;
	whyItMatters?: string;
	recommendedAction?: string;
	metric?: string;
	trend?: AIInsightTrendPoint[];
	sourceNote?: string;
	onViewActions?: () => void;
};

export function AIInsightsCard({
	status = "ready",
	title = "AI Insights",
	headline = "Conversions are down despite relatively stable traffic.",

	// Keep these because DashboardCardView still supplies them.
	// We'll use them in the actions view later.
	whyItMatters,
	recommendedAction,

	metric = "Conversions",
	trend,
	sourceNote = "Based on connected data · Selected period",
	onViewActions,
	className = "",
	...props
}: AIInsightsCardProps) {
	const isEmpty = status === "empty";
	const isError = status === "error";
	const isLoading = status === "loading";
	const isReady = status === "ready";
	const [recommendationsOpen, setRecommendationsOpen] = useState(false);

	return (
		<>
		<section
			className={[
				"relative h-[408px] overflow-hidden rounded-2xl",
				"shadow-[0_8px_24px_rgba(0,0,0,0.08)] ring-1 ring-black/5",
				"text-white",
				className,
			].join(" ")}
			style={{
				background:
					"linear-gradient(135deg, #d9e4ff 0%, #d2c7f3 52%, #d8b9ec 100%)",
			}}
			{...props}
		>
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute inset-0 bg-white/[0.05]" />
			</div>

			<div className="relative flex h-full flex-col p-7">
				<div className="mb-5 flex shrink-0 items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/18 ring-1 ring-white/20">
						<Sparkles className="h-5 w-5" />
					</div>

					<h3 className="text-[1.125rem] font-semibold tracking-[-0.02em] text-white/95">
						{title}
					</h3>
				</div>

				{isLoading ? (
					<div className="flex flex-1 flex-col">
						<div className="h-[185px] animate-pulse rounded-2xl border border-white/10 bg-white/10" />

						<div className="mt-5">
							<div className="h-5 w-[72%] animate-pulse rounded bg-white/20" />
							<div className="mt-2 h-5 w-[48%] animate-pulse rounded bg-white/20" />
						</div>

						<div className="mt-auto flex items-center justify-between">
							<div className="h-3 w-40 animate-pulse rounded bg-white/15" />
							<div className="h-9 w-44 animate-pulse rounded-xl bg-white/15" />
						</div>
					</div>
				) : isEmpty ? (
					<div className="flex flex-1 flex-col justify-center">
						<h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75">
							No insight yet
						</h4>

						<p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-white/90">
							There isn&apos;t enough usable data in this period to generate a meaningful insight.
						</p>

						<p className="mt-4 max-w-3xl text-sm leading-7 text-white/75">
							We&apos;ll keep monitoring your data and surface an insight when enough information is available.
						</p>
					</div>
				) : isError ? (
					<div className="flex flex-1 flex-col justify-center">
						<h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/75">
							Insight temporarily unavailable
						</h4>

						<p className="mt-4 max-w-2xl text-[1.05rem] font-semibold leading-snug text-white">
							We could not generate an AI insight right now.
						</p>

						<p className="mt-4 max-w-2xl text-sm leading-7 text-white/75">
							Your dashboard data is still available. Please try again shortly.
						</p>
					</div>
				) : isReady ? (
					<div className="flex min-h-0 flex-1 flex-col">
						<AIInsightChart
							metric={metric}
							data={trend}
						/>

						<p className="mt-4 max-w-3xl text-[1rem] font-semibold leading-snug text-white">
							{headline}
						</p>

						<div className="mt-auto flex items-end justify-between gap-4 pt-4">
							<p className="max-w-[50%] text-xs leading-5 text-white/65">
								{sourceNote}
							</p>

							<button
								type="button"
								onClick={() => {
								setRecommendationsOpen(true);
								onViewActions?.();
								}}
								className={[
								"group flex shrink-0 items-center gap-2",
								"rounded-xl px-5 py-3",
								"bg-gradient-to-r from-violet-600 to-indigo-600",
								"text-sm font-semibold text-white",
								"shadow-[0_8px_20px_rgba(99,70,220,0.28)]",
								"ring-1 ring-white/20",
								"transition-all duration-200",
								"hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(99,70,220,0.36)]",
								"active:translate-y-0",
								"focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80",
								].join(" ")}
								>
								See recommended actions

	<ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
</button>
						</div>
					</div>
				) : null}
			</div>
		</section>
		<AIRecommendationsModal
			open={recommendationsOpen}
			onClose={() => setRecommendationsOpen(false)}
			headline={headline}
			whyItMatters={whyItMatters}
			recommendedAction={recommendedAction}
			sourceNote={sourceNote}
		/>
	</>
	);
}