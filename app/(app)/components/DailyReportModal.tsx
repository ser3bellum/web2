"use client";

import { useEffect } from "react";
import { BaseModal } from "./ui/Modal";

type DailyReport = {
  date: string;
  headline: string;
  bullets: string[];
  reportId: string;
};

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

  return (
    <BaseModal
      title={report.headline}
      subtitle={`Date: ${report.date}`}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button
            type="button"
            onClick={() => {
              onMarkSeen();
              window.open(`/reports/${report.reportId}/print`, "_blank");
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            Print
          </button>

          <button
            type="button"
            onClick={() => {
              onMarkSeen();
              // swap route when you have it
              window.location.href = `/reports/${report.reportId}`;
            }}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 active:bg-slate-950"
          >
            View full report
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            Close
          </button>
        </>
      }
    >
      <ul className="mt-2 space-y-2">
        {report.bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm text-slate-700">
            <span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-slate-300" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </BaseModal>
  );
}
