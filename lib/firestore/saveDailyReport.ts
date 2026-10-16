
import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";
import type { DailyReportDoc } from "@/lib/reports/types";
import type { SavedAIInsightDoc } from "@/lib/firestore/saveAIInsight";
import type { SyncSummaryDoc } from "@/lib/firestore/saveSyncSummary";

function stripUndefinedDeep<T>(value: T): T {
	if (Array.isArray(value)) {
		return value.map((item) => stripUndefinedDeep(item)) as T;
	}

	if (value && typeof value === "object") {
		const result: Record<string, unknown> = {};

		for (const [key, val] of Object.entries(value)) {
			if (val !== undefined) {
				result[key] = stripUndefinedDeep(val);
			}
		}

		return result as T;
	}

	return value;
}

export async function saveDailyReport(args: {
	workspaceId: string;
	syncSummary: SyncSummaryDoc;
	insight: SavedAIInsightDoc | null;
	headline: string;
	summary: string;
}) {
	const reportDate = args.syncSummary.dateWindow.to;
    const reportId = `daily_${reportDate}`;
    const createdAtIso = new Date().toISOString();

	const report: DailyReportDoc = {
		reportId,
		workspaceId: args.workspaceId,

		type: "daily",
		version: 1,

		period: {
			from: args.syncSummary.dateWindow.from,
			to: args.syncSummary.dateWindow.to,
		},

		headline: args.headline,
		summary: args.summary,

		signals: args.syncSummary.signals,
		connectorStatus: args.syncSummary.connectorStatus,
		connectorIds: args.syncSummary.connectorIds,

		insight: args.insight
			? {
					insightId: args.insight.insightId,
					headline: args.insight.headline,
					whyItMatters: args.insight.whyItMatters,
					recommendedAction: args.insight.recommendedAction,
					severity: args.insight.severity,
					status: args.insight.status,
					sourceNote: args.insight.sourceNote,
					generatedAt: args.insight.generatedAt,
				}
			: null,

		syncRunId: args.syncSummary.syncRunId,
		sourceInsightId: args.insight?.insightId ?? null,

		generatedAt: createdAtIso,
		createdAtIso,
	};

	const ref = adminDb
		.collection("workspaces")
		.doc(args.workspaceId)
		.collection("reports")
		.doc(reportId);

await adminDb.runTransaction(async (transaction) => {
	const existing = await transaction.get(ref);

	if (existing.exists) {
		throw new Error(
			`Daily report already exists for ${reportDate}.`,
		);
	}

	transaction.create(
		ref,
		stripUndefinedDeep({
			...report,
			createdAt: FieldValue.serverTimestamp(),
		}),
	);
});

	return report;
}