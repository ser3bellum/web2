"use client";

import { useEffect, useMemo, useState } from "react";
import DailyReportModal from "./DailyReportModal";

type DailyReport = {
	date: string;
	headline: string;
	bullets: string[];
	reportId: string;
};

function todayKey() {
	const d = new Date();
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const dd = String(d.getDate()).padStart(2, "0");
	return `${yyyy}-${mm}-${dd}`;
}

const STORAGE_KEY = "ser3bellum.dailyReport.lastSeen";

export default function DailyReportModalController({
	workspaceId,
}: {
	workspaceId: string;
}) {
	const [open, setOpen] = useState(false);
	const [report, setReport] = useState<DailyReport | null>(null);
	const today = useMemo(() => todayKey(), []);

	useEffect(() => {
		let cancelled = false;

		async function loadSummary() {
			try {
				const lastSeen = localStorage.getItem(STORAGE_KEY);

				if (lastSeen === today) return;

				const res = await fetch(
					`/api/dashboard/latest-summary?workspaceId=${workspaceId}`
				);

				const data = await res.json();

				if (!res.ok) {
					throw new Error(data?.error || "Failed to load summary");
				}

				if (!cancelled && data.report) {
					setReport(data.report);
					setOpen(true);
				}
			} catch (error) {
				console.error("Failed to hydrate daily summary modal:", error);
			}
		}

		loadSummary();

		return () => {
			cancelled = true;
		};
	}, [today, workspaceId]);

	const close = () => {
		setOpen(false);

		try {
			localStorage.setItem(STORAGE_KEY, today);
		} catch {}
	};

	if (!open || !report) return null;

	return (
		<DailyReportModal report={report} onClose={close} onMarkSeen={close} />
	);
}
