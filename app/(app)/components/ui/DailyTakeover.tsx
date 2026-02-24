"use client";

import { useEffect } from "react";

export default function DailyTakeover({
	title,
	subtitle,
	onClose,
	children,
	footer,
}: {
	title: string;
	subtitle?: string;
	onClose: () => void;
	children: React.ReactNode;
	footer?: React.ReactNode;
}) {
	// Escape closes
	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKeyDown);

		// Lock scroll behind takeover
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		return () => {
			window.removeEventListener("keydown", onKeyDown);
			document.body.style.overflow = prev;
		};
	}, [onClose]);

	return (
		<div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true">
			{/* Backdrop: covers sidebar + topbar too */}
			<div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

			{/* Panel: full screen */}
			<div className="absolute inset-0 flex">
				<section className="relative h-full w-full overflow-y-auto bg-white">
					{/* Header */}
					<header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
						<div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
							<div>
								<h2 className="text-xl font-semibold text-slate-900">
									{title}
								</h2>
								{subtitle ? (
									<div className="mt-1 text-sm text-slate-500">{subtitle}</div>
								) : null}
							</div>

							<button
								type="button"
								onClick={onClose}
								className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
							>
								Close
							</button>
						</div>
					</header>

					{/* Content */}
					<div className="mx-auto max-w-5xl px-6 py-10">{children}</div>

					{/* Footer */}
					{footer ? (
						<div className="sticky bottom-0 border-t border-slate-200 bg-white/90 backdrop-blur">
							<div className="mx-auto flex max-w-5xl flex-wrap justify-end gap-3 px-6 py-4">
								{footer}
							</div>
						</div>
					) : null}
				</section>
			</div>
		</div>
	);
}
