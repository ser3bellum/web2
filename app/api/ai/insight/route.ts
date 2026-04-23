import { NextResponse } from "next/server";
import {
  generateDashboardInsight,
  type DashboardInsightInput,
} from "@/lib/ai/generateDashboardInsight";
import { generateGeminiDashboardInsight } from "@/lib/ai/generateGeminiDashboardInsight";
import { buildDashboardInsightInput } from "@/lib/ai/buildDashboardInsightInput";
import { getLatestSyncSummary } from "@/lib/firestore/getLatestSyncSummary";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const workspaceId =
    searchParams.get("workspaceId")?.trim() || "demo-end-user";

  const latestSummary = await getLatestSyncSummary(workspaceId);

  if (!latestSummary) {
    return NextResponse.json(
      generateDashboardInsight({} satisfies DashboardInsightInput)
    );
  }

  const input: DashboardInsightInput =
    buildDashboardInsightInput(latestSummary);

  try {
    const payload = await generateGeminiDashboardInsight(input);
    return NextResponse.json(payload);
  } catch (error) {
    console.error(
      "Gemini insight failed, falling back to rule-based insight:",
      error
    );

    const fallback = generateDashboardInsight(input);
    return NextResponse.json(fallback);
  }
}