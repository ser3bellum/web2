"use client";

import { Card } from "app/(app)/components/Card";
import { BaseModal } from "app/(app)/components/ui/Modal";
import { useMemo, useState } from "react";
import type { DashboardKpi } from "./dashboardKpis";

function toneClass(tone?: "up" | "down" | "neutral") {
	if (tone === "down") return "text-red-600";
	if (tone === "up") return "text-emerald-600";
	return "text-neutral-500";
}

export function KpiStrip({ kpis }: { kpis: DashboardKpi[] }) {
	const [activeId, setActiveId] = useState<string | null>(null);

	const activeKpi = useMemo(
		() => kpis.find((k) => k.id === activeId) ?? null,
		[activeId, kpis],
	);

	return (
		<>
			<section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
				{kpis.map((kpi) => {
					const isActive = kpi.id === activeId;
					const tone = toneClass(kpi.delta?.tone);

					return (
						<button
							key={kpi.id}
							type="button"
							onClick={() => setActiveId(kpi.id)}
							className="text-left"
						>
							<Card
								title={kpi.title}
								subtitle={kpi.subtitle}
								className={[
									"min-h-[88px]",
									"cursor-pointer select-none",
									"transition-all",
									"hover:-translate-y-[1px] hover:shadow-md",
									"hover:ring-2 hover:ring-indigo-500/60",
									isActive ? "ring-2 ring-indigo-500 shadow-md" : "",
								].join(" ")}
								rightSlot={
									kpi.delta ? (
										<span className={["text-xs font-medium", tone].join(" ")}>
											{kpi.delta.value}
										</span>
									) : null
								}
							>
								<div className="text-2xl font-semibold leading-none">
									{kpi.value}
								</div>
							</Card>
						</button>
					);
				})}
			</section>

			{/* Modal */}
			{activeKpi ? (
				<BaseModal
					title={activeKpi.title}
					onClose={() => setActiveId(null)}
					size="xl"
					footer={
						<button
							type="button"
							onClick={() => setActiveId(null)}
							className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
						>
							Close
						</button>
					}
				>
					<div className="grid gap-4">
						<p className="text-sm text-slate-600">
							Detailed activity for the selected period.
						</p>

						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
								<div className="text-xs text-slate-500">Total for period</div>
								<div className="text-2xl font-semibold text-slate-900">
									{activeKpi.value}
								</div>
							</div>

							<div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
								<div className="text-xs text-slate-500">Delta</div>
								<div
									className={[
										"text-2xl font-semibold",
										toneClass(activeKpi.delta?.tone),
									].join(" ")}
								>
									{activeKpi.delta?.value ?? "—"}
								</div>
							</div>
						</div>

						<div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
							Chart placeholder (next step)
						</div>
					</div>
				</BaseModal>
			) : null}
		</>
	);
}
