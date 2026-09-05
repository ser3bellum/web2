"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import DailyReportModal from "./DailyReportModal";
import type { DailyReport } from "@/types/reports";
const STORAGE_PREFIX = "ser3bellum.dailyReport.lastSeen";

export default function DailyReportModalController({ workspaceId }: { workspaceId: string }) {
	const [open, setOpen] = useState(false);
	const [closing, setClosing] = useState(false);
	const [report, setReport] = useState<DailyReport | null>(null);
	const pendingActionRef = useRef<"view" | null>(null);
	const storageKey = `${STORAGE_PREFIX}.${workspaceId}`;

	useEffect(() => {
		const abortController = new AbortController();

		async function loadSummary() {
			try {
				const response = await fetch(
					`/api/dashboard/latest-summary?workspaceId=${encodeURIComponent(workspaceId)}`,
					{ cache: "no-store", signal: abortController.signal },
				);
				const data = await response.json();
				if (!response.ok) throw new Error(data?.error || "Failed to load summary");
				if (!data.report) return;

				const lastSeenReportId = localStorage.getItem(storageKey);
				if (lastSeenReportId === data.report.reportId) return;

				setReport(data.report);
				setOpen(true);
			} catch (error) {
				if (error instanceof DOMException && error.name === "AbortError") return;
				console.error("Failed to hydrate daily summary modal:", error);
			}
		}

		void loadSummary();
		return () => abortController.abort();
	}, [storageKey, workspaceId]);

	const markSeen = useCallback(() => {
		if (!report) return;
		try {
			localStorage.setItem(storageKey, report.reportId);
		} catch {
			// Storage can be unavailable in hardened/private browser contexts.
		}
	}, [report, storageKey]);

	const requestClose = useCallback((reason: "close" | "view") => {
		if (closing) return;
		pendingActionRef.current = reason === "view" ? "view" : null;
		setClosing(true);
	}, [closing]);

	const handleClosed = useCallback(() => {
		markSeen();
		setOpen(false);
		setClosing(false);

		if (pendingActionRef.current === "view" && report) {
			window.location.assign(`/reports/${encodeURIComponent(report.reportId)}`);
		}
		pendingActionRef.current = null;
	}, [markSeen, report]);

	const handlePrint = useCallback(() => {
		if (!report) return;
		markSeen();
		window.open(
			`/reports/${encodeURIComponent(report.reportId)}/print`,
			"_blank",
			"noopener,noreferrer",
		);
		requestClose("close");
	}, [markSeen, report, requestClose]);

	if (!open || !report) return null;

	return (
		<DailyReportModal
			report={report}
			closing={closing}
			onRequestClose={requestClose}
			onClosed={handleClosed}
			onPrint={handlePrint}
		/>
	);
}