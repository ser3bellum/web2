
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getUserCompanyContext } from "@/lib/data/getUserCompanyContext";

import {
  generateDashboardInsight,
  type DashboardInsightInput,
} from "@/lib/ai/generateDashboardInsight";

import { generateGeminiDashboardInsight } from "@/lib/ai/generateGeminiDashboardInsight";
import { generateADKDashboardInsight } from "@/lib/ai/generateADKDashboardInsight";
import { buildDashboardInsightInput } from "@/lib/ai/buildDashboardInsightInput";
import { getLatestSyncSummary } from "@/lib/firestore/getLatestSyncSummary";

import {
  getLatestAIInsight,
  saveAIInsight,
} from "@/lib/firestore/saveAIInsight";

export const runtime = "nodejs";

const INSIGHT_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function GET() {
  try {
    const sessionCookie = (await cookies())
      .get("__Host-sb_auth")?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { user, company } =
      await getUserCompanyContext(sessionCookie);

    if (!user?.id || !company?.id) {
      return NextResponse.json(
        { error: "No active workspace" },
        { status: 403 }
      );
    }

    if (user.lastWorkspaceId !== company.id) {
      return NextResponse.json(
        { error: "Active workspace not verified" },
        { status: 403 }
      );
    }

    const workspaceId = company.id;

    // Reuse an insight generated within the last 24 hours.
    const existingInsight =
      await getLatestAIInsight(workspaceId);

    if (existingInsight) {
      const createdAt = Date.parse(
        existingInsight.createdAtIso
      );

      const age = Date.now() - createdAt;

     if (
  Number.isFinite(age) &&
  age >= 0 &&
  age < INSIGHT_WINDOW_MS
) {
  console.log("[AI] Returning cached insight", {
    source: existingInsight.source,
    ageMinutes: Math.round(age / 60000),
  });

  const {
    workspaceId: _workspaceId,
    insightId: _insightId,
    ...publicInsight
  } = existingInsight;

  return NextResponse.json(publicInsight);
}
    }

    const latestSummary =
      await getLatestSyncSummary(workspaceId);

    if (!latestSummary) {
      return NextResponse.json(
        generateDashboardInsight(
          {} satisfies DashboardInsightInput
        )
      );
    }

    const input: DashboardInsightInput =
      buildDashboardInsightInput(latestSummary);

    // Primary: ADK + Gemini.
    try {
      const payload =
       await generateADKDashboardInsight(input, workspaceId);

      await saveAIInsight({
        workspaceId,
        syncRunId: latestSummary.syncRunId,
        source: "adk",
        payload,
      });

      return NextResponse.json(payload);
    } catch (adkError) {
      console.error(
        "ADK insight failed, trying Gemini:",
        adkError
      );
    }

    // Secondary: existing Gemini implementation.
    try {
  const payload =
    await generateGeminiDashboardInsight(input);

      await saveAIInsight({
        workspaceId,
        syncRunId: latestSummary.syncRunId,
        source: "gemini",
        payload,
      });

      return NextResponse.json(payload);
    } catch (geminiError) {
      console.error(
        "Gemini insight failed, using rule-based fallback:",
        geminiError
      );
    }

    // Final fallback: rule-based insight.
    const fallback = generateDashboardInsight(input);

    await saveAIInsight({
      workspaceId,
      syncRunId: latestSummary.syncRunId,
      source: "fallback",
      payload: fallback,
    });

    return NextResponse.json(fallback);
  } catch (error) {
    console.error("AI insight endpoint failed:", error);

    return NextResponse.json(
      { error: "Failed to generate AI insight" },
      { status: 500 }
    );
  }
}
