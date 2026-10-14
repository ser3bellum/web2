
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserCompanyContext } from "@/lib/data/getUserCompanyContext";
import { generateADKDashboardInsight } from "@/lib/ai/generateADKDashboardInsight";
import { buildDashboardInsightInput } from "@/lib/ai/buildDashboardInsightInput";
import { getLatestSyncSummary } from "@/lib/firestore/getLatestSyncSummary";

export const runtime = "nodejs";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not available outside development" },
      { status: 404 }
    );
  }

  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__Host-sb_auth")?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { user, company } =
      await getUserCompanyContext(sessionCookie);

    if (!user || !company) {
      return NextResponse.json(
        { error: "No workspace associated with this user" },
        { status: 404 }
      );
    }

    // Only use an existing workspace belonging to this user.
    // Legacy company records are not valid workspace IDs here.
    if (user.lastWorkspaceId !== company.id) {
      return NextResponse.json(
        { error: "No active workspace found" },
        { status: 404 }
      );
    }


    const latestSummary = await getLatestSyncSummary(company.id);

    if (!latestSummary) {
      return NextResponse.json(
        { error: "No saved sync summary for this workspace" },
        { status: 404 }
      );
    }

    const snapshot = buildDashboardInsightInput(latestSummary);
    const result = await generateADKDashboardInsight(snapshot);

    return NextResponse.json(result);
  } catch (error) {
    console.error("ADK real-data test failed:", error);

    return NextResponse.json(
      { error: "ADK real-data test failed" },
      { status: 500 }
    );
  }
}
