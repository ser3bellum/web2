"use client";

import { Portal } from "app/(app)/components/Portal";
import { cn } from "app/(app)/lib/cn";
import type React from "react";
import { useEffect } from "react";

type ModalProps = {
	open: boolean;
	onClose: () => void;
	title?: string;
	description?: string;
	children: React.ReactNode;

	/** visual variants */
	variant?: "frosted" | "solid";
	size?: "sm" | "md" | "lg" | "xl";

	/** behavior */
	closeOnBackdrop?: boolean;
	showClose?: boolean;

	/** optional footer slot */
	footer?: React.ReactNode;
};

function sizeClass(size: NonNullable<ModalProps["size"]>) {
	switch (size) {
		case "sm":
			return "max-w-md";
		case "md":
			return "max-w-2xl";
		case "lg":
			return "max-w-3xl";
		case "xl":
			return "max-w-4xl w-full";
		default:
			return "max-w-2xl";
	}
}

export function Modal({
	open,
	onClose,
	title,
	description,
	children,
	variant = "frosted",
	size = "md",
	closeOnBackdrop = true,
	showClose = true,
	footer,
}: ModalProps) {
	// ESC closes
	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [open, onClose]);

	// Lock body scroll (nice for big modals)
	useEffect(() => {
		if (!open) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prev;
		};
	}, [open]);

	if (!open) return null;

	const panelClass =
		variant === "frosted"
			? "border border-slate-200 bg-white shadow-2xl"
			: "border border-slate-200 bg-white shadow-2xl";

	return (
		<Portal>
			<div
				role="dialog"
				aria-modal="true"
				aria-label={title ?? "Dialog"}
				className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
				onMouseDown={(e) => {
					if (!closeOnBackdrop) return;
					if (e.target === e.currentTarget) onClose();
				}}
			>
				{/* Backdrop */}
				<div className="absolute inset-0 bg-white/35 backdrop-blur-md backdrop-brightness-90" />

				{/* Panel */}
				<div
					className={cn(
						"relative w-full rounded-2xl",
						"max-h-[85vh] overflow-y-auto",
						sizeClass(size),
						panelClass,
					)}
				>
					{(title || showClose) && (
						<div className="flex items-start justify-between gap-4 px-6 pt-6">
							<div>
								{title && (
									<div className="text-lg font-semibold text-zinc-900">
										{title}
									</div>
								)}
								{description && (
									<div className="mt-1 text-sm text-zinc-600">
										{description}
									</div>
								)}
							</div>

							{showClose && (
								<button
									type="button"
									onClick={onClose}
									aria-label="Close"
									className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
								>
									✕
								</button>
							)}
						</div>
					)}

					<div className="px-6 pb-6 pt-4">{children}</div>

					{footer && (
						<div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
							{footer}
						</div>
					)}
				</div>
			</div>
		</Portal>
	);
}
