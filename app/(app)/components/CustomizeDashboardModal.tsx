"use client";

import type {
	DashboardCardDef,
	DashboardCardId,
} from "app/(app)/components/DashboardCards";
import { Modal } from "app/(app)/components/Modal";
import { cn } from "app/(app)/lib/cn";
import { useEffect, useMemo, useState } from "react";

const KEY_MVP = "sb.dashboard.mvp.v1"; // exactly 5
const KEY_ENABLED = "sb.dashboard.enabled.v1"; // up to 9

function loadJson<T>(key: string): T | null {
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return null;
		return JSON.parse(raw) as T;
	} catch {
		return null;
	}
}
function saveJson<T>(key: string, value: T) {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// ignore
	}
}

type Props = {
	open: boolean;
	onClose: () => void;
	cards: DashboardCardDef[];
	// Optional: let parent refresh UI after save
	onSaved?: (v: { mvp: DashboardCardId[]; enabled: DashboardCardId[] }) => void;
};

export function CustomizeDashboardModal({
	open,
	onClose,
	cards,
	onSaved,
}: Props) {
	const allIds = useMemo(() => cards.map((c) => c.id), [cards]);

	// sensible defaults:
	// - MVP: pick first 5 defaultEnabled cards (or first 5 in list)
	// - Enabled: pick first 9 defaultEnabled cards (or first 9 in list)
	const defaultEnabled = useMemo(
		() => cards.filter((c) => c.defaultEnabled).map((c) => c.id),
		[cards],
	);
	const defaultMvp = useMemo(
		() => (defaultEnabled.length ? defaultEnabled : allIds).slice(0, 5),
		[defaultEnabled, allIds],
	);
	const defaultEnabled9 = useMemo(
		() => (defaultEnabled.length ? defaultEnabled : allIds).slice(0, 9),
		[defaultEnabled, allIds],
	);

	const [mvp, setMvp] = useState<DashboardCardId[]>(defaultMvp);
	const [enabled, setEnabled] = useState<DashboardCardId[]>(defaultEnabled9);

	// init on open so it reflects saved state
	useEffect(() => {
		if (!open) return;

		const savedMvp = loadJson<DashboardCardId[]>(KEY_MVP);
		const savedEnabled = loadJson<DashboardCardId[]>(KEY_ENABLED);

		const clean = (arr: DashboardCardId[] | null) =>
			(arr ?? []).filter((id) => allIds.includes(id));

		const nextMvp = clean(savedMvp);
		const nextEnabled = clean(savedEnabled);

		setMvp(nextMvp.length ? nextMvp.slice(0, 5) : defaultMvp);
		setEnabled(nextEnabled.length ? nextEnabled.slice(0, 9) : defaultEnabled9);
	}, [open, allIds, defaultMvp, defaultEnabled9]);

	// ESC closes
	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [open, onClose]);

	const _mvpCount = mvp.length;
	const enabledCount = enabled.length;

	const toggleMvp = (id: DashboardCardId) => {
		setMvp((prev) => {
			const has = prev.includes(id);
			if (has) return prev.filter((x) => x !== id); // allow unselecting (user can change mind)
			if (prev.length >= 5) return prev; // limit 5
			return [...prev, id];
		});
	};

	const toggleEnabled = (id: DashboardCardId) => {
		setEnabled((prev) => {
			const has = prev.includes(id);
			if (has) return prev.filter((x) => x !== id);
			if (prev.length >= 9) return prev; // limit 9
			return [...prev, id];
		});
	};

	const done = () => {
		// if user didn’t pick exactly 5 MVP, we fall back to defaults (per your “if user decides not…” logic)
		const finalMvp = mvp.length === 5 ? mvp : defaultMvp;
		const finalEnabled = enabled.length ? enabled : defaultEnabled9;

		saveJson(KEY_MVP, finalMvp);
		saveJson(KEY_ENABLED, finalEnabled);

		onSaved?.({ mvp: finalMvp, enabled: finalEnabled });
		onClose();
	};

	if (!open) return null;

	return (
		<Modal
			open={open}
			onClose={onClose}
			title="Customize Dashboard"
			variant="solid"
			size="lg"
		>
			{/* Body */}
			<div className="px-6 pb-6 pt-4">
				<div className="grid grid-cols-1 gap-8 md:grid-cols-2">
					{/* LEFT: MVP */}
					<div>
						<div className="flex items-center justify-between">
							<div className="text-sm font-medium text-blue-700">
								Select your 5MVP
							</div>

							{/* 5 dots */}
							<div
								className="flex items-center gap-2"
								aria-label="MVP selection progress"
								role="progressbar"
  								aria-valuemin={0}
  								aria-valuemax={5}
  								aria-valuenow={mvp.length} // or whatever the current count is
>
							
								{Array.from({ length: 5 }).map((_, i) => (
  								<span
   								 key={`mvp-dot-${i}`}
    							className={cn(
     							 "h-3 w-3 rounded-full",
     							 i < mvp.length ? "bg-indigo-600" : "bg-slate-300"
   								 )}
  									/>
									))}
							</div>
						</div>

						<div className="mt-5 space-y-3">
							{cards.map((c) => {
								const selected = mvp.includes(c.id);
								const disabled = !selected && mvp.length >= 5;

								return (
									<button type="button"
										key={c.id}
										onClick={() => toggleMvp(c.id)}
										disabled={disabled}
										className={cn(
											"flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition",
											disabled && "opacity-50 cursor-not-allowed",
										)}
									>
										<RadioDot checked={selected} />
										<div className="text-sm text-zinc-900">{c.title}</div>
									</button>
								);
							})}
						</div>

						<div className="mt-3 text-xs text-zinc-500">
							{mvp.length < 5
								? `Pick ${5 - mvp.length} more.`
								: "MVP complete."}
						</div>
					</div>

					{/* RIGHT: enabled cards */}
					<div className="relative">
						{/* Divider */}
						<div className="absolute -left-4 top-2 hidden h-[calc(100%-8px)] w-px bg-zinc-200 md:block" />

						<div className="flex items-center justify-between">
							<div className="text-sm font-medium text-blue-700">
								Chose your 9 cards
							</div>
							<div className="text-xs text-zinc-500">
								{enabledCount}/9 selected
							</div>
						</div>

						<div className="mt-5 space-y-3">
							{cards.map((c) => {
								const on = enabled.includes(c.id);
								const disabled = !on && enabled.length >= 9;

								return (
									<div
										key={c.id}
										className={cn(
											"flex items-center justify-between rounded-lg px-2 py-2",
											disabled && "opacity-50",
										)}
									>
										<div className="text-sm text-zinc-900">{c.title}</div>
										<Toggle
											checked={on}
											disabled={disabled}
											onChange={() => toggleEnabled(c.id)}
										/>
									</div>
								);
							})}
						</div>

						<div className="mt-3 text-xs text-zinc-500">
							You can change this anytime.
						</div>

						{/* Done button */}
						<div className="mt-6 flex justify-end">
							<button
								type="button"
								onClick={done}
								className="h-10 rounded-lg bg-blue-700 px-6 text-sm font-medium text-white hover:bg-blue-800"
							>
								Done
							</button>
						</div>
					</div>
				</div>

				{/* Small hint row (optional) */}
				<div className="mt-6 text-xs text-zinc-400">
					If you don’t choose MVP, Ser3bellum will apply sensible defaults.
				</div>
			</div>
		</Modal>
	);
}

function RadioDot({ checked }: { checked: boolean }) {
	return (
		<span
			className={cn(
				"grid h-5 w-5 place-items-center rounded-full border",
				checked ? "border-blue-700" : "border-zinc-300",
			)}
			aria-hidden
		>
			<span
				className={cn(
					"h-2.5 w-2.5 rounded-full",
					checked ? "bg-blue-700" : "bg-transparent",
				)}
			/>
		</span>
	);
}

function Toggle({
	checked,
	disabled,
	onChange,
}: {
	checked: boolean;
	disabled?: boolean;
	onChange: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onChange}
			disabled={disabled}
			aria-pressed={checked}
			className={cn(
				"relative inline-flex h-7 w-12 items-center rounded-full border transition-colors",
				checked ? "bg-blue-700 border-blue-700" : "bg-zinc-200 border-zinc-200",
				disabled && "cursor-not-allowed",
			)}
		>
			<span
				className={cn(
					"inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform",
					checked ? "translate-x-6" : "translate-x-1",
				)}
			/>
		</button>
	);
}
