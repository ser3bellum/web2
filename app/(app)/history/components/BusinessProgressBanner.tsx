import type { BusinessProgress } from "../types";

type BusinessProgressBannerProps = {
	progress: BusinessProgress;
};

export function BusinessProgressBanner({
	progress,
}: BusinessProgressBannerProps) {
	return (
		<section className="rounded-2xl border border-white/40 bg-white/35 px-6 py-5 backdrop-blur-xl">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="min-w-0">
					<p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
						{progress.label}
					</p>

					<h2 className="mt-1 text-xl font-semibold text-slate-900">
						{progress.title}
					</h2>

					<p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
						{progress.description}
					</p>
				</div>

				{progress.change ? (
					<div className="shrink-0 text-left md:text-right">
						<div className="text-2xl font-semibold text-emerald-600">
							{progress.change}
						</div>

						<div className="mt-1 text-xs text-slate-400">
							vs previous period
						</div>
					</div>
				) : null}
			</div>
		</section>
	);
}