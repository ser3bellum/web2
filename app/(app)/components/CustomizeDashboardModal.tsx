"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  DashboardCardDef,
  DashboardCardId,
} from "app/(app)/components/DashboardCards";

import {
  DASHBOARD_ENABLED_KEY,
  DASHBOARD_MVP_KEY,
  loadJson,
  saveJson,
} from "app/(app)/components/dashboardPreferences";

import { Modal } from "app/(app)/components/Modal";
import { cn } from "app/(app)/lib/cn";

import type {
  DashboardKpiDefinition,
  DashboardKpiId,
} from "app/(app)/dashboard/DashboardKpiDefinitions";

type Props = {
  open: boolean;
  onClose: () => void;
  cards: DashboardCardDef[];
  kpis: DashboardKpiDefinition[];
  onSaved?: (value: {
    mvp: DashboardKpiId[];
    enabled: DashboardCardId[];
  }) => void;
};

const ROW_CLASS = "min-h-[42px] rounded-lg px-2 py-1.5";

const HEADER_CLASS =
  "min-h-[40px] flex items-center justify-between";

export function CustomizeDashboardModal({
  open,
  onClose,
  cards,
  kpis,
  onSaved,
}: Props) {
  const allCardIds = useMemo(
    () => cards.map((card) => card.id),
    [cards],
  );

  const allKpiIds = useMemo(
    () => kpis.map((kpi) => kpi.id),
    [kpis],
  );

  const defaultEnabledCards = useMemo(
    () =>
      cards
        .filter((card) => card.defaultEnabled)
        .map((card) => card.id),
    [cards],
  );

  const defaultMvp = useMemo(
    () =>
      kpis
        .filter((kpi) => kpi.defaultEnabled)
        .map((kpi) => kpi.id)
        .slice(0, 5),
    [kpis],
  );

  const defaultEnabled9 = useMemo(
    () =>
      (
        defaultEnabledCards.length
          ? defaultEnabledCards
          : allCardIds
      ).slice(0, 9),
    [defaultEnabledCards, allCardIds],
  );

  const [mvp, setMvp] =
    useState<DashboardKpiId[]>(defaultMvp);

  const [enabled, setEnabled] =
    useState<DashboardCardId[]>(defaultEnabled9);

  useEffect(() => {
    if (!open) return;

    const savedMvp =
      loadJson<DashboardKpiId[]>(DASHBOARD_MVP_KEY);

    const savedEnabled =
      loadJson<DashboardCardId[]>(DASHBOARD_ENABLED_KEY);

    const cleanMvp = (savedMvp ?? []).filter((id) =>
      allKpiIds.includes(id),
    );

    const cleanEnabled = (savedEnabled ?? []).filter((id) =>
      allCardIds.includes(id),
    );

    setMvp(
      cleanMvp.length
        ? cleanMvp.slice(0, 5)
        : defaultMvp,
    );

    setEnabled(
      cleanEnabled.length
        ? cleanEnabled.slice(0, 9)
        : defaultEnabled9,
    );
  }, [
    open,
    allKpiIds,
    allCardIds,
    defaultMvp,
    defaultEnabled9,
  ]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [open, onClose]);

  const enabledCount = enabled.length;

  const toggleMvp = (id: DashboardKpiId) => {
    setMvp((previous) => {
      const selected = previous.includes(id);

      if (selected) {
        return previous.filter((item) => item !== id);
      }

      if (previous.length >= 5) {
        return previous;
      }

      return [...previous, id];
    });
  };

  const toggleEnabled = (id: DashboardCardId) => {
    setEnabled((previous) => {
      const selected = previous.includes(id);

      if (selected) {
        return previous.filter((item) => item !== id);
      }

      if (previous.length >= 9) {
        return previous;
      }

      return [...previous, id];
    });
  };

  const done = () => {
    const finalMvp =
      mvp.length === 5 ? mvp : defaultMvp;

    const finalEnabled =
      enabled.length > 0 ? enabled : defaultEnabled9;

    saveJson(DASHBOARD_MVP_KEY, finalMvp);
    saveJson(DASHBOARD_ENABLED_KEY, finalEnabled);

    window.dispatchEvent(
      new Event("sb-dashboard-preferences-updated"),
    );

    onSaved?.({
      mvp: finalMvp,
      enabled: finalEnabled,
    });

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
          {/* LEFT: KPI / MVP selection */}
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
                aria-valuenow={mvp.length}
              >
                {Array.from({ length: 5 }).map((_, index) => (
                  <span
                    key={`mvp-dot-${index}`}
                    className={cn(
                      "h-3 w-3 rounded-full transition-colors",
                      index < mvp.length
                        ? "bg-indigo-600"
                        : "bg-slate-300",
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="text-[11px] text-zinc-400">
              Choose the 5 KPIs you want to monitor at a glance.
            </div>

            <div className="mt-2 space-y-1">
              {kpis.map((kpi) => {
                const selected = mvp.includes(kpi.id);

                const disabled =
                  !selected && mvp.length >= 5;

                return (
                  <button
                    type="button"
                    key={kpi.id}
                    onClick={() => toggleMvp(kpi.id)}
                    disabled={disabled}
                    className={cn(
                      "flex w-full items-center gap-3 text-left transition",
                      ROW_CLASS,
                      "hover:bg-zinc-50",
                      disabled &&
                        "cursor-not-allowed opacity-50 hover:bg-transparent",
                    )}
                  >
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                      <RadioDot checked={selected} />
                    </div>

                    <div className="min-w-0">
                      <div className="text-[13px] text-zinc-900">
                        {kpi.title}
                      </div>

                      <div className="text-[11px] text-zinc-400">
                        {kpi.subtitle}
                      </div>
                    </div>
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

          {/* RIGHT: dashboard card selection */}
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
              {cards.map((card) => {
                const selected = enabled.includes(card.id);

                const disabled =
                  !selected && enabled.length >= 9;

                return (
                  <div
                    key={card.id}
                    className={cn(
                      "flex items-center justify-between gap-4",
                      ROW_CLASS,
                      disabled && "opacity-50",
                    )}
                  >
                    <div className="min-w-0 text-[13px] text-zinc-900">
                      {card.title}
                    </div>

                    <div className="flex h-7 w-12 shrink-0 items-center justify-center">
                      <Toggle
                        checked={selected}
                        disabled={disabled}
                        onChange={() =>
                          toggleEnabled(card.id)
                        }
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

function RadioDot({
  checked,
}: {
  checked: boolean;
}) {
  return (
    <span
      className={cn(
        "grid h-5 w-5 place-items-center rounded-full border transition-colors",
        checked
          ? "border-blue-700"
          : "border-zinc-300",
      )}
      aria-hidden
    >
      <span
        className={cn(
          "h-2.5 w-2.5 rounded-full transition-colors",
          checked
            ? "bg-blue-700"
            : "bg-transparent",
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
        checked
          ? "border-blue-700 bg-blue-700"
          : "border-zinc-200 bg-zinc-200",
        disabled && "cursor-not-allowed",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
          checked
            ? "translate-x-6"
            : "translate-x-1",
        )}
      />
    </button>
  );
}