"use client";

import { useEffect } from "react";

type DailyReport = {
	date: string;
	headline: string;
	bullets: string[];
	reportId: string;
};

function SummaryPill({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "summary" | "alert" | "system";
}) {
  const toneClasses =
    tone === "summary"
      ? "bg-violet-50 text-violet-700"
      : tone === "alert"
      ? "bg-rose-50 text-rose-700"
      : tone === "system"
      ? "bg-amber-50 text-amber-700"
      : "bg-sky-50 text-sky-700";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${toneClasses}`}
    >
      {children}
    </span>
  );
}
function SummaryRow({
  label,
  text,
  tone = "default",
}: {
  label: string;
  text: string;
  tone?: "default" | "summary" | "alert" | "system";
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <SummaryPill tone={tone}>{label}</SummaryPill>
          </div>
          <p className="mt-3 text-base text-slate-700">{text}</p>
        </div>
      </div>
    </div>
  );
}

export default function DailyReportModal({
	report,
	onClose,
	onMarkSeen,
}: {
	report: DailyReport;
	onClose: () => void;
	onMarkSeen: () => void;
}) {
	// Escape closes modal
	useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const rows = report.bullets.map((bullet, index) => {
    const lower = bullet.toLowerCase();

    if (lower.includes("uptime")) {
      return { label: "summary", text: bullet, tone: "summary" as const };
    }

    if (
      lower.includes("alert") ||
      lower.includes("incident") ||
      lower.includes("downtime")
    ) {
      return { label: "alert", text: bullet, tone: "alert" as const };
    }

    if (
      lower.includes("endpoint") ||
      lower.includes("latency") ||
      lower.includes("p95") ||
      lower.includes("cpu")
    ) {
      return { label: "system", text: bullet, tone: "system" as const };
    }

    return {
      label: `signal ${index + 1}`,
      text: bullet,
      tone: "default" as const,
    };
  });
	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-label="Daily report"
			className="modal-backdrop"
			onMouseDown={(e) => {
				// click outside closes
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<div className="modal-card">
				<div className="border-b border-slate-200 px-5 py-5">
					
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 className="text-3xl font-semibold text-slate-900">
                Operational Summary
              </h2>
              <p className="mt-2 text-base text-slate-500">
                Recent alerts, system signals, and daily health insights from
                Ser3bellum.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="px-7 py-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-slate-900">
                  {report.headline}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  Generated on {report.date}
                </div>
              </div>

              <SummaryPill tone="summary">daily summary</SummaryPill>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="text-xl font-semibold text-slate-900">
                Recent signals
              </h3>
              <span className="text-sm text-slate-500">Latest activity</span>
            </div>

            <div className="space-y-3">
              {rows.map((row, index) => (
                <SummaryRow
                  key={`${row.text}-${index}`}
                  label={row.label}
                  text={row.text}
                  tone={row.tone}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-7 py-5">
          <button
            type="button"
            onClick={() => {
              onMarkSeen();
              window.open(`/reports/${report.reportId}/print`, "_blank");
            }}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Print
          </button>

          <button
            type="button"
            onClick={() => {
              onMarkSeen();
              window.location.href = `/reports/${report.reportId}`;
            }}
            className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            View full report
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
	);
}
