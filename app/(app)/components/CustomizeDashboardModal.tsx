"use client";

import type {
  DashboardCardDef,
  DashboardCardId,
} from "app/(app)/components/DashboardCards";
import { Modal } from "app/(app)/components/Modal";
import { cn } from "app/(app)/lib/cn";
import { useEffect, useMemo, useState } from "react";

import {
  DASHBOARD_MVP_KEY,
  DASHBOARD_ENABLED_KEY,
  loadJson,
  saveJson,
} from "app/(app)/components/dashboardPreferences";

type Props = {
  open: boolean;
  onClose: () => void;
  cards: DashboardCardDef[];
  onSaved?: (v: { mvp: DashboardCardId[]; enabled: DashboardCardId[] }) => void;
};

const ROW_CLASS =
  "min-h-[42px] rounded-lg px-2 py-1.5";
const HEADER_CLASS =
  "min-h-[40px] flex items-center justify-between";

export function CustomizeDashboardModal({
  open,
  onClose,
  cards,
  onSaved,
}: Props) {
  const allIds = useMemo(() => cards.map((c) => c.id), [cards]);

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

  useEffect(() => {
    if (!open) return;

    const savedMvp = loadJson<DashboardCardId[]>(DASHBOARD_MVP_KEY);
    const savedEnabled = loadJson<DashboardCardId[]>(DASHBOARD_ENABLED_KEY);

    const clean = (arr: DashboardCardId[] | null) =>
      (arr ?? []).filter((id) => allIds.includes(id));

    const nextMvp = clean(savedMvp);
    const nextEnabled = clean(savedEnabled);

    setMvp(nextMvp.length ? nextMvp.slice(0, 5) : defaultMvp);
    setEnabled(nextEnabled.length ? nextEnabled.slice(0, 9) : defaultEnabled9);
  }, [open, allIds, defaultMvp, defaultEnabled9]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const enabledCount = enabled.length;

  const toggleMvp = (id: DashboardCardId) => {
    setMvp((prev) => {
      const has = prev.includes(id);
      if (has) return prev.filter((x) => x !== id);
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  };

  const toggleEnabled = (id: DashboardCardId) => {
    setEnabled((prev) => {
      const has = prev.includes(id);
      if (has) return prev.filter((x) => x !== id);
      if (prev.length >= 9) return prev;
      return [...prev, id];
    });
  };

  const done = () => {
    const finalMvp = mvp.length === 5 ? mvp : defaultMvp;
    const finalEnabled = enabled.length ? enabled : defaultEnabled9;

    saveJson(DASHBOARD_MVP_KEY, finalMvp);
    saveJson(DASHBOARD_ENABLED_KEY, finalEnabled);

    window.dispatchEvent(new Event("sb-dashboard-preferences-updated"));

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
      <div className="px-6 pb-6 pt-1">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* LEFT: MVP */}
          <div className="space-y-1">
  			<div className={HEADER_CLASS}>
    		<div className="text-sm font-semibold text-blue-700">
      		Select your 5 MVP
    		</div>

              <div
      			className="flex items-center gap-2"
      			aria-label="MVP selection progress"
      			role="progressbar"
      			aria-valuemin={0}
      			aria-valuemax={5}
      			aria-valuenow={mvp.length}>

      			{Array.from({ length: 5 }).map((_, i) => (
        		<span
          		key={`mvp-dot-${i}`}
          		className={cn(
           		 "h-3 w-3 rounded-full transition-colors",
            	i < mvp.length ? "bg-indigo-600" : "bg-slate-300",
         		 )}
        		/>
      			))}
    		</div>
  </div>

  			<div className="text-[11px] text-zinc-400">
    			If you don’t choose an MVP, Ser3bellum will apply sensible defaults.
  			</div>


            <div className="mt-2 space-y-1">
              {cards.map((c) => {
                const selected = mvp.includes(c.id);
                const disabled = !selected && mvp.length >= 5;

                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => toggleMvp(c.id)}
                    disabled={disabled}
                    className={cn(
                      "flex w-full items-center gap-3 text-left transition",
                      ROW_CLASS,
                      "hover:bg-zinc-50",
                      disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
                    )}
                  >
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                      <RadioDot checked={selected} />
                    </div>

                    <div className="min-w-0 text-[13px] text-zinc-900">
                      {c.title}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 text-xs text-zinc-500">
              {mvp.length < 5 ? `Pick ${5 - mvp.length} more.` : "MVP complete."}
            </div>
          </div>

          {/* RIGHT: enabled cards */}
          <div className="relative">
            <div className="absolute -left-4 top-0 hidden h-full w-px bg-zinc-200 md:block" />

            <div className="space-y-1">
 			 <div className={HEADER_CLASS}>
    		<div className="text-sm font-semibold text-blue-700">
     		 Choose your 9 cards
    		</div>

    		<div className="text-xs text-zinc-500">
      		{enabledCount}/9 selected
    		</div>
  			</div>

  			<div className="text-[11px] text-zinc-400">
   			You can change this anytime.
 			</div>
			</div>

            <div className="mt-2 space-y-1">
              {cards.map((c) => {
                const on = enabled.includes(c.id);
                const disabled = !on && enabled.length >= 9;

                return (
                  <div
                    key={c.id}
                    className={cn(
                      "flex items-center justify-between gap-4",
                      ROW_CLASS,
                      disabled && "opacity-50",
                    )}
                  >
                    <div className="min-w-0 text-[13px] text-zinc-900">
                      {c.title}
                    </div>

                    <div className="flex h-7 w-12 shrink-0 items-center justify-center">
                      <Toggle
                        checked={on}
                        disabled={disabled}
                        onChange={() => toggleEnabled(c.id)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={done}
                className="h-10 rounded-lg bg-blue-700 px-6 text-[13px] font-medium text-white transition hover:bg-blue-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>

      </div>
    </Modal>
  );
}

function RadioDot({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "grid h-5 w-5 place-items-center rounded-full border transition-colors",
        checked ? "border-blue-700" : "border-zinc-300",
      )}
      aria-hidden
    >
      <span
        className={cn(
          "h-2.5 w-2.5 rounded-full transition-colors",
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
        checked ? "border-blue-700 bg-blue-700" : "border-zinc-200 bg-zinc-200",
        disabled && "cursor-not-allowed",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}
