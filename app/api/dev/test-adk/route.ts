
import "server-only";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getUserCompanyContext } from "@/lib/data/getUserCompanyContext";
import { getLatestSyncSummary } from "@/lib/firestore/getLatestSyncSummary";
import { getHistoricalSyncSummaries } from "@/lib/firestore/getHistoricalSyncSummaries";
import { buildDashboardInsightInput } from "@/lib/ai/buildDashboardInsightInput";
import { generateADKDashboardInsight } from "@/lib/ai/generateADKDashboardInsight";

export const runtime = "nodejs";

export async function GET() {
  // This endpoint is temporary and must not run in production.
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not available" },
      { status: 404 },
    );
  }

  try {
    const sessionCookie = (await cookies())
      .get("__Host-sb_auth")?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 },
      );
    }

    const { user, company } =
      await getUserCompanyContext(sessionCookie);

    if (
      !user?.id ||
      !company?.id ||
      user.lastWorkspaceId !== company.id
    ) {
      return NextResponse.json(
        { error: "Workspace not authorized" },
        { status: 403 },
      );
    }

    const workspaceId = company.id;

    const latestSummary =
      await getLatestSyncSummary(workspaceId);

    if (!latestSummary) {
      return NextResponse.json(
        { error: "No sync summary found" },
        { status: 404 },
      );
    }

    const historicalSummaries =
      await getHistoricalSyncSummaries(workspaceId, 7);

    const input =
      buildDashboardInsightInput(latestSummary);

    const insight = await generateADKDashboardInsight(
      input,
      workspaceId,
    );

    return NextResponse.json({
      ok: true,
      history: {
        retrieved: historicalSummaries.length,
        periods: historicalSummaries.map(
          (summary) => ({
            generatedAt: summary.generatedAt,
            dateWindow: summary.dateWindow,
          }),
        ),
      },
      insight,
    });
  } catch (error) {
    console.error("[ADK RAG Test] Failed:", error);

    return NextResponse.json(
      { error: "ADK RAG test failed" },
      { status: 500 },
    );
  }
}
