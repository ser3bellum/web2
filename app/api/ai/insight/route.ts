import { NextResponse } from "next/server";
import {
  generateDashboardInsight,
  type DashboardInsightInput,
} from "@/lib/ai/generateDashboardInsight";
import { generateGeminiDashboardInsight } from "@/lib/ai/generateGeminiDashboardInsight";
import { buildDashboardInsightInput } from "@/lib/ai/buildDashboardInsightInput";
import { getLatestSyncSummary } from "@/lib/firestore/getLatestSyncSummary";
import { saveAIInsight } from "@/lib/firestore/saveAIInsight";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const workspaceId =
    searchParams.get("workspaceId")?.trim() || "demo-end-user";

  const latestSummary = await getLatestSyncSummary(workspaceId);

  if (!latestSummary) {
    const emptyPayload = generateDashboardInsight(
      {} satisfies DashboardInsightInput
    );

    return NextResponse.json(emptyPayload);
  }

  const input: DashboardInsightInput =
    buildDashboardInsightInput(latestSummary);

  try {
    const payload = await generateGeminiDashboardInsight(input);

    await saveAIInsight({
      workspaceId,
      syncRunId: latestSummary.syncRunId,
      source: "gemini",
      payload,
    });

    return NextResponse.json(payload);
  } catch (error) {
    console.error(
      "Gemini insight failed, falling back to rule-based insight:",
      error
    );

    const fallback = generateDashboardInsight(input);

    await saveAIInsight({
      workspaceId,
      syncRunId: latestSummary.syncRunId,
      source: "fallback",
      payload: fallback,
    });

    return NextResponse.json(fallback);
  }
}