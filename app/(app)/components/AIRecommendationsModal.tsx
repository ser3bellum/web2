"use client";

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

export function AIRecommendationsModal({
	open,
	onClose,
	headline,
	whyItMatters,
	recommendedAction,
	sourceNote,
}: AIRecommendationsModalProps) {
	return (
		<Modal
			open={open}
			onClose={onClose}
			size="lg"
			showClose
		>
			<div className="px-2 pb-2">
				{/* Header */}
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

				{/* Insight */}
				<div className="mt-7">
					<p className="text-lg font-semibold leading-7 text-zinc-900">
						{headline}
					</p>
				</div>

				{/* Why it matters */}
				{whyItMatters && (
					<div className="mt-7 border-t border-slate-200 pt-6">
						<p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
							Why it matters
						</p>

						<p className="mt-3 text-sm leading-7 text-zinc-700">
							{whyItMatters}
						</p>
					</div>
				)}

				{/* Recommended action */}
				{recommendedAction && (
					<div className="mt-6 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 p-5 ring-1 ring-violet-100">
						<div className="flex items-start gap-4">
							<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-violet-700 shadow-sm ring-1 ring-violet-100">
								<Lightbulb className="h-4 w-4" />
							</div>

							<div className="min-w-0">
								<p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-600">
									Recommended action
								</p>

								<p className="mt-2 text-base font-semibold leading-7 text-zinc-900">
									{recommendedAction}
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Source */}
				{sourceNote && (
					<div className="mt-6 flex items-center gap-2 text-xs leading-5 text-zinc-500">
						<ArrowRight className="h-3.5 w-3.5 shrink-0" />
						<span>{sourceNote}</span>
					</div>
				)}
			</div>
		</Modal>
	);
}