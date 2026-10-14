
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getUserCompanyContext } from "@/lib/data/getUserCompanyContext";
import { buildSyncSummaryFromHydrationCards } from "@/lib/ai/buildSyncSummary";
import { saveSyncSummary } from "@/lib/firestore/saveSyncSummary";
import { getDashboardHydration } from "@/app/(app)/dashboard/getDashboardHydration";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // Authenticate the individual user.
    const sessionCookie = (await cookies())
      .get("__Host-sb_auth")?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { user, company } =
      await getUserCompanyContext(sessionCookie);

    if (!user?.id || !company?.id) {
      return NextResponse.json(
        { ok: false, error: "No active workspace" },
        { status: 403 }
      );
    }

    // Only use the workspace currently associated
    // with the authenticated user.
    const activeWorkspaceId = user.lastWorkspaceId;

    if (!activeWorkspaceId || activeWorkspaceId !== company.id) {
      return NextResponse.json(
        { ok: false, error: "Active workspace not verified" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const today = new Date().toISOString().slice(0, 10);

    const from =
      typeof body?.from === "string" ? body.from : today;

    const to =
      typeof body?.to === "string" ? body.to : today;

    // Nango connections belong to the individual.
    const hydration = await getDashboardHydration({
      from,
      to,
      endUserId: user.id,
    });

    // Reports belong to the shared workspace.
    const summary = buildSyncSummaryFromHydrationCards({
      workspaceId: company.id,
      syncSource: "manual_refresh",
      hydrationCards: hydration.cards ?? [],
      businessSources: hydration.businessSources,
      dateWindow: {
        from: hydration.range.from,
        to: hydration.range.to,
      },
    });

    const savedSummary = await saveSyncSummary(summary);

    return NextResponse.json({
      ok: true,
      syncRunId: savedSummary.syncRunId,
      hydration,
    });
  } catch (error) {
    console.error("Dashboard refresh failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to refresh dashboard data.",
      },
      { status: 500 }
    );
  }
}
