"use client";

import type React from "react";

type ModalSize = "sm" | "md" | "lg" | "xl";

export function BaseModal({
	title,
	subtitle,
	children,
	footer,
	onClose,
	size = "lg",
	bodyClassName,
}: {
	title: string;
	subtitle?: string;
	children: React.ReactNode;
	footer?: React.ReactNode;
	onClose: () => void;
	size?: ModalSize;
	bodyClassName?: string;
}) {
	const maxW =
		size === "sm"
			? "max-w-md"
			: size === "md"
				? "max-w-xl"
				: size === "xl"
					? "max-w-5xl"
					: "max-w-4xl";

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<button
				type="button"
				aria-label="Close modal"
				onClick={onClose}
				className="absolute inset-0 bg-white/35 backdrop-blur-md backdrop-brightness-90"
			/>

			<div
				className={[
					"relative flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] flex-col overflow-hidden",
					maxW,
					"rounded-2xl border border-slate-200 bg-white shadow-2xl",
				].join(" ")}
				role="dialog"
				aria-modal="true"
				aria-label={title}
			>
				<div className="flex shrink-0 items-start justify-between gap-4 px-6 pt-6">
					<div>
						<h2 className="text-lg font-semibold text-slate-900">
							{title}
						</h2>
						{subtitle ? (
							<p className="mt-1 text-sm text-slate-500">
								{subtitle}
							</p>
						) : null}
					</div>

					<button
						type="button"
						onClick={onClose}
						aria-label="Close"
						className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
					>
						✕
					</button>
				</div>

				<div
					className={[
						"min-h-0 px-6 pb-6 pt-4",
						bodyClassName ?? "overflow-y-auto",
					].join(" ")}
				>
					{children}
				</div>

				{footer ? (
					<div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
						{footer}
					</div>
				) : null}
			</div>
		</div>
	);
}