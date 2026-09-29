import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import type { DailyReportDoc } from "@/lib/reports/types";

export async function getDailyReportsByIds(
	workspaceId: string,
	reportIds: string[],
): Promise<DailyReportDoc[]> {
	const normalizedWorkspaceId = workspaceId.trim();

	const normalizedReportIds = [
		...new Set(
			reportIds
				.map((id) => id.trim())
				.filter(Boolean),
		),
	];

	if (
		!normalizedWorkspaceId ||
		normalizedReportIds.length === 0
	) {
		return [];
	}

	const refs = normalizedReportIds.map((reportId) =>
		adminDb
			.collection("workspaces")
			.doc(normalizedWorkspaceId)
			.collection("reports")
			.doc(reportId),
	);

	const snapshots = await adminDb.getAll(...refs);

	const reportsById = new Map<string, DailyReportDoc>();

	for (const snapshot of snapshots) {
		if (!snapshot.exists) continue;

		const report = snapshot.data() as DailyReportDoc;

		// Extra protection against malformed/cross-workspace data.
		if (report.workspaceId !== normalizedWorkspaceId) {
			continue;
		}

		reportsById.set(snapshot.id, report);
	}

	// Preserve the exact order requested by History.
	return normalizedReportIds
		.map((reportId) => reportsById.get(reportId))
		.filter(
			(report): report is DailyReportDoc =>
				Boolean(report),
		);
}