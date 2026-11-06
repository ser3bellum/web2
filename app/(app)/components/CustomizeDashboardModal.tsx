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

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2";

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
  const mvpComplete = mvp.length >= 5;

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

  const reset = () => {
    setMvp(defaultMvp);
    setEnabled(defaultEnabled9);
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
        <p className="mb-6 text-sm text-slate-500">
          Pin what matters most, then decide which cards
          live on your dashboard.
        </p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* LEFT: KPI / MVP selection */}
          <section className="flex flex-col gap-5 rounded-2xl bg-slate-50 p-6">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-[17px] font-bold text-blue-700">
                  Select your 5 MVP
                </h3>

                <div className="flex items-center gap-2.5">
                  <div
                    className="flex gap-1"
                    aria-label="MVP selection progress"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={5}
                    aria-valuenow={mvp.length}
                  >
                    {Array.from({ length: 5 }).map(
                      (_, index) => (
                        <span
                          key={`mvp-seg-${index}`}
                          className={cn(
                            "h-1.5 w-5 rounded-full transition-colors",
                            index < mvp.length
                              ? "bg-blue-700"
                              : "bg-slate-300",
                          )}
                        />
                      ),
                    )}
                  </div>

                  <span className="min-w-[28px] text-right text-[13px] font-bold text-slate-900">
                    {mvp.length}/5
                  </span>
                </div>
              </div>

              <p className="text-[13px] text-slate-500">
                Choose the 5 KPIs you want to monitor at a
                glance.
              </p>
            </div>

            <div className="space-y-2">
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
                    aria-pressed={selected}
                    className={cn(
                      "flex w-full items-center gap-3.5 rounded-2xl border-[1.5px] px-3 py-2.5 text-left transition",
                      FOCUS_RING,
                      selected
                      ? " bg-white shadow-sm"
                      : "border-slate-300 bg-transparent hover:bg-white",
                      disabled &&
                        "cursor-not-allowed opacity-55 hover:bg-transparent",
                    )}
                  >
                    <span
                     className={cn(
                     "flex h-10 w-10 shrink-0 items-center justify-center",
                     selected ? "text-slate-700" : "text-slate-500",
                     )}
                      >
                    <KpiIcon id={String(kpi.id)} />
                  </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-normal leading-5 text-black/70">
                      {kpi.title}
                      </span>

                      <span className="block text-[13px] leading-[18px] text-slate-500">
                        {kpi.subtitle}
                      </span>
                    </span>

                    <span
                      aria-hidden
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors",
                        selected
                          ? "bg-blue-700"
                          : "border-[1.5px] border-slate-400",
                      )}
                    >
                      {selected && <CheckIcon />}
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              className={cn(
                "inline-flex items-center gap-2 self-start rounded-full px-4 py-2 text-sm font-semibold",
                mvpComplete
                  ? "bg-emerald-100 text-emerald-800"
                  : "border border-slate-200 bg-white text-slate-500",
              )}
            >
              {mvpComplete && <CheckIcon size={16} />}
              {mvpComplete
                ? "MVP complete"
                : `${5 - mvp.length} more to pick`}
            </div>
          </section>

          {/* RIGHT: dashboard card selection */}
          <section className="flex flex-col gap-5 rounded-2xl border-[1.5px] border-slate-200 bg-white p-6">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-[17px] font-bold text-blue-700">
                  Choose your 9 cards
                </h3>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-[13px] font-semibold text-blue-700">
                  {enabledCount}/9 selected
                </span>
              </div>

              <p className="text-[13px] text-slate-500">
                You can change this anytime.
              </p>
            </div>

            <div className="flex flex-col">
              {cards.map((card) => {
                const selected = enabled.includes(card.id);

                const disabled =
                  !selected && enabled.length >= 9;

                return (
                  <div
                    key={card.id}
                    className={cn(
                      "flex h-[52px] items-center justify-between gap-4 border-b border-slate-100 last:border-b-0",
                      disabled && "opacity-50",
                    )}
                  >
                    <span className="min-w-0 text-[15px] font-normal text-black/70">
                      {card.title}
                    </span>

                    <Toggle
                      checked={selected}
                      disabled={disabled}
                      label={card.title}
                      onChange={() => toggleEnabled(card.id)}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={reset}
            className={cn(
              "h-12 rounded-[14px] border-[1.5px] border-slate-200 bg-white px-6 text-[15px] font-semibold text-slate-900 transition hover:bg-slate-50",
              FOCUS_RING,
            )}
          >
            Reset
          </button>

          <button
            type="button"
            onClick={done}
            className={cn(
              "h-12 rounded-[14px] bg-blue-700 px-9 text-[15px] font-bold text-white shadow-lg shadow-blue-700/30 transition hover:bg-blue-800",
              FOCUS_RING,
            )}
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Toggle({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-[26px] w-[46px] shrink-0 items-center rounded-full p-0.5 transition-colors",
        FOCUS_RING,
        checked ? "bg-blue-700" : "bg-slate-400",
        disabled && "cursor-not-allowed",
      )}
    >
      <span
        className={cn(
          "inline-block h-[22px] w-[22px] rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-white"
      aria-hidden
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

/**
 * Icônes déduites de l'id du KPI (sans dépendance externe).
 * Si l'id ne correspond à rien, on affiche une icône générique.
 */
function KpiIcon({ id }: { id: string }) {
  const key = id.toLowerCase();

  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (key.includes("analytic") || key.includes("traffic")) {
    return (
      <svg {...common}>
        <path d="M3 17l6-6 4 4 8-8" />
        <path d="M15 7h6v6" />
      </svg>
    );
  }

  if (key.includes("sale")) {
    return (
      <svg {...common}>
        <path d="M6 8h12l1 12H5L6 8z" />
        <path d="M9 8a3 3 0 0 1 6 0" />
      </svg>
    );
  }

  if (key.includes("market")) {
    return (
      <svg {...common}>
        <path d="M3 11v2a1 1 0 0 0 1 1h3l7 4V6L7 10H4a1 1 0 0 0-1 1z" />
        <path d="M18 9a4 4 0 0 1 0 6" />
      </svg>
    );
  }

  if (key.includes("down") || key.includes("uptime")) {
    return (
      <svg {...common}>
        <path d="M3 12h4l3-8 4 16 3-8h4" />
      </svg>
    );
  }

  if (key.includes("crm") || key.includes("pipeline")) {
    return (
      <svg {...common}>
        <path d="M3 4h18l-7 8v7l-4 2v-9L3 4z" />
      </svg>
    );
  }

  if (key.includes("financ") || key.includes("payment")) {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
      </svg>
    );
  }

  if (key.includes("social")) {
    return (
      <svg {...common}>
        <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
      </svg>
    );
  }

  if (key.includes("book") || key.includes("reserv")) {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  );
}
