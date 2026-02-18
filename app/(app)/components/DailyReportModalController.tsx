"use client";

import { useEffect, useMemo, useState } from "react";
import DailyReportModal from "./DailyReportModal";

function todayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const STORAGE_KEY = "ser3bellum.dailyReport.lastSeen";

export default function DailyReportModalController() {
  const [open, setOpen] = useState(false);
  const today = useMemo(() => todayKey(), []);

  useEffect(() => {
    try {
      const lastSeen = localStorage.getItem(STORAGE_KEY);
      if (lastSeen !== today) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, [today]);

  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, today);
    } catch {}
  };

  const report = {
    date: today,
    headline: "Daily Ops Summary",
    bullets: [
      "Uptime: 99.97% (last 24h)",
      "2 alerts resolved, 1 ongoing",
      "Slowest endpoint: /api/health (p95 820ms)",
    ],
    reportId: `daily-${today}`,
  };

  if (!open) return null;

  return <DailyReportModal report={report} onClose={close} onMarkSeen={close} />;
}
