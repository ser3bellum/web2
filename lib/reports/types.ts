import type {
	AIInsightSeverity,
	AIInsightStatus,
} from "@/types/ai";

import type { SyncSummaryDoc } from "@/lib/firestore/saveSyncSummary";

export type ReportInsightSnapshot = {
	insightId: string;
	headline: string;
	whyItMatters: string;
	recommendedAction: string;
	severity?: AIInsightSeverity;
	status: AIInsightStatus;
	sourceNote?: string;
	generatedAt?: string;
};

export type DailyReportDoc = {
	reportId: string;
	workspaceId: string;

	type: "daily";
	version: 1;

	period: {
		from: string;
		to: string;
	};

	headline: string;
	summary: string;

	signals: SyncSummaryDoc["signals"];
	connectorStatus: SyncSummaryDoc["connectorStatus"];
	connectorIds: string[];

	insight: ReportInsightSnapshot | null;

	syncRunId: string;
	sourceInsightId: string | null;

	generatedAt: string;
	createdAtIso: string;
};