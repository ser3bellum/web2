import { getDashboardHydration } from "@/app/(app)/dashboard/getDashboardHydration";

import { buildSyncSummaryFromHydrationCards } from "@/lib/ai/buildSyncSummary";
import { buildDashboardInsightInput } from "@/lib/ai/buildDashboardInsightInput";
import {
	generateDashboardInsight,
	type DashboardInsightInput,
} from "@/lib/ai/generateDashboardInsight";
import { generateGeminiDashboardInsight } from "@/lib/ai/generateGeminiDashboardInsight";

import { saveSyncSummary } from "@/lib/firestore/saveSyncSummary";
import { saveAIInsight } from "@/lib/firestore/saveAIInsight";

import { createDailyReport } from "@/lib/reports/createDailyReport";

export async function runDailyReportCycle(args: {
	workspaceId: string;
	from: string;
	to: string;
}) {
	const { workspaceId, from, to } = args;

	/*
	 * 1. Fetch the business data for this reporting period.
	 */
	const hydration = await getDashboardHydration({
		from,
		to,
		endUserId: workspaceId,
	});

	const hydrationCards = hydration.cards ?? [];

	/*
	 * 2. Build and persist the normalized snapshot.
	 */
	const summary = buildSyncSummaryFromHydrationCards({
		workspaceId,
		syncSource: "scheduled",
		hydrationCards,
		dateWindow: {
			from: hydration.range.from,
			to: hydration.range.to,
		},
	});

	const savedSummary = await saveSyncSummary(summary);

	/*
	 * 3. Convert the persisted snapshot into the AI input.
	 */
	const input: DashboardInsightInput =
		buildDashboardInsightInput(savedSummary);

	/*
	 * 4. Generate the insight.
	 *
	 * Gemini is preferred, but the report cycle must still complete
	 * if Gemini is temporarily unavailable.
	 */
	let savedInsight;

	try {
		const payload =
			await generateGeminiDashboardInsight(input);

		savedInsight = await saveAIInsight({
			workspaceId,
			syncRunId: savedSummary.syncRunId,
			source: "gemini",
			payload,
		});
	} catch (error) {
		console.error(
			"Daily report Gemini insight failed, using fallback:",
			error,
		);

		const fallback = generateDashboardInsight(input);

		savedInsight = await saveAIInsight({
			workspaceId,
			syncRunId: savedSummary.syncRunId,
			source: "fallback",
			payload: fallback,
		});
	}

	/*
	 * 5. Finalize the immutable historical report.
	 */
	const report = await createDailyReport({
		workspaceId,
		syncSummary: savedSummary,
		insight: savedInsight,
	});

	return {
		report,
		syncSummary: savedSummary,
		insight: savedInsight,
	};
}