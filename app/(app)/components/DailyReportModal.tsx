"use client";

import { useEffect } from "react";

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
        <div className="modal-header">
          <h2>{report.headline}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <p className="muted">Date: {report.date}</p>

        <ul>
          {report.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>

        <div className="modal-actions">
          <button
            onClick={() => {
              onMarkSeen();
              window.open(`/reports/${report.reportId}/print`, "_blank");
            }}
          >
            Print
          </button>

          <button
            onClick={() => {
              onMarkSeen();
              // swap route when you have it
              window.location.href = `/reports/${report.reportId}`;
            }}
          >
            View full report
          </button>

          <button className="secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
