import type { SavedAIInsightDoc } from "@/lib/firestore/saveAIInsight";
import type { SyncSummaryDoc } from "@/lib/firestore/saveSyncSummary";
import { saveDailyReport } from "@/lib/firestore/saveDailyReport";

export async function createDailyReport(args: {
	workspaceId: string;
	syncSummary: SyncSummaryDoc;
	insight: SavedAIInsightDoc | null;
}) {
	const { workspaceId, syncSummary, insight } = args;

	// Make sure the sync summary belongs to this workspace.
	if (syncSummary.workspaceId !== workspaceId) {
		throw new Error(
			"Sync summary does not belong to this workspace.",
		);
	}

	// If an AI insight exists, it must belong to the same sync run.
	if (
		insight?.syncRunId &&
		insight.syncRunId !== syncSummary.syncRunId
	) {
		throw new Error(
			"AI insight and sync summary belong to different sync runs.",
		);
	}

	const headline =
		insight?.headline ?? "Daily business report";

	const summary =
		insight?.whyItMatters ??
		"No AI summary was available for this analysis cycle.";

	return saveDailyReport({
		workspaceId,
		syncSummary,
		insight,
		headline,
		summary,
	});
}