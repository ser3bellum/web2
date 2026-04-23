//app/api/dashboard/refresh/route.ts

import { NextResponse } from "next/server";
import { buildSyncSummaryFromHydrationCards } from "@/lib/ai/buildSyncSummary";
import { saveSyncSummary } from "@/lib/firestore/saveSyncSummary";
import { getDashboardHydration } from "@/app/(app)/dashboard/getDashboardHydration";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const from =
      typeof body?.from === "string"
        ? body.from
        : new Date().toISOString().slice(0, 10);

    const to =
      typeof body?.to === "string"
        ? body.to
        : new Date().toISOString().slice(0, 10);

    const endUserId =
      typeof body?.endUserId === "string" && body.endUserId.trim().length > 0
        ? body.endUserId
        : "demo-end-user";

    const hydration = await getDashboardHydration({
      from,
      to,
      endUserId,
    });

    const hydrationCards = hydration.cards ?? [];

    const summary = buildSyncSummaryFromHydrationCards({
      workspaceId: endUserId,
      syncSource: "manual_refresh",
      hydrationCards,
      dateWindow: {
        from: hydration.range.from,
        to: hydration.range.to,
      },
    });

    await saveSyncSummary(summary);

    return NextResponse.json({
      ok: true,
      hydration,
    });
  } catch (error) {
    console.error("Dashboard refresh failed:", error);

    return NextResponse.json(
      { ok: false, error: "Failed to refresh dashboard data." },
      { status: 500 }
    );
  }
}