
import { NextResponse } from "next/server";
import { generateADKDashboardInsight } from "@/lib/ai/generateADKDashboardInsight";
import type { DashboardInsightInput } from "@/lib/ai/generateDashboardInsight";

export const runtime = "nodejs";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not available outside development" },
      { status: 404 }
    );
  }

  const snapshot = {
    analytics: {
      sessions: 120,
    },
    sales: {
      revenue: 850,
      orderCount: 12,
      currency: "EUR",
    },
  } satisfies DashboardInsightInput;

  try {
    const result = await generateADKDashboardInsight(snapshot);

    return NextResponse.json(result);
  } catch (error) {
    console.error("ADK integration test failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown ADK error",
      },
      { status: 500 }
    );
  }
}
