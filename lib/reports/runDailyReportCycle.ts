
import { getDashboardHydration } from "@/app/(app)/dashboard/getDashboardHydration";

import { buildSyncSummaryFromHydrationCards } from "@/lib/ai/buildSyncSummary";
import { buildDashboardInsightInput } from "@/lib/ai/buildDashboardInsightInput";
import {
  generateDashboardInsight,
  type DashboardInsightInput,
} from "@/lib/ai/generateDashboardInsight";
import { generateGeminiDashboardInsight } from "@/lib/ai/generateGeminiDashboardInsight";
import { generateADKDashboardInsight } from "@/lib/ai/generateADKDashboardInsight";

import { saveSyncSummary } from "@/lib/firestore/saveSyncSummary";
import { saveAIInsight } from "@/lib/firestore/saveAIInsight";

import { createDailyReport } from "@/lib/reports/createDailyReport";

export async function runDailyReportCycle(args: {
  workspaceId: string;
  endUserId: string;
  from: string;
  to: string;
}) {
  const { workspaceId, endUserId, from, to } = args;

  // 1. Fetch business data using the user's connector identity.
  const hydration = await getDashboardHydration({
    from,
    to,
    endUserId,
  });

  // 2. Build and save the normalized snapshot.
  const summary = buildSyncSummaryFromHydrationCards({
    workspaceId,
    syncSource: "scheduled",
    hydrationCards: hydration.cards ?? [],
    businessSources: hydration.businessSources,
    dateWindow: {
      from: hydration.range.from,
      to: hydration.range.to,
    },
  });

  const savedSummary = await saveSyncSummary(summary);

  // 3. Build the AI input.
  const input: DashboardInsightInput =
    buildDashboardInsightInput(savedSummary);

  // 4. Generate and save the insight.
  let savedInsight;

  try {
    const payload = await generateADKDashboardInsight(input);

    savedInsight = await saveAIInsight({
      workspaceId,
      syncRunId: savedSummary.syncRunId,
      source: "adk",
      payload,
    });
  } catch (adkError) {
    console.error(
      "Daily report ADK insight failed, trying Gemini:",
      adkError
    );

    try {
      const payload =
        await generateGeminiDashboardInsight(input);

      savedInsight = await saveAIInsight({
        workspaceId,
        syncRunId: savedSummary.syncRunId,
        source: "gemini",
        payload,
      });
    } catch (geminiError) {
      console.error(
        "Daily report Gemini insight failed, using fallback:",
        geminiError
      );

      const fallback = generateDashboardInsight(input);

      savedInsight = await saveAIInsight({
        workspaceId,
        syncRunId: savedSummary.syncRunId,
        source: "fallback",
        payload: fallback,
      });
    }
  }

  // 5. Save the historical daily report.
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
