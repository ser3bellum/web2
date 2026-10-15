import { NextResponse } from "next/server";

import { runDailyReportsForUsers } from "@/lib/reports/runDailyReportsForUsers";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const authorization = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("CRON_SECRET is not configured.");

    return NextResponse.json(
      { ok: false, error: "Server configuration error." },
      { status: 500 },
    );
  }

  if (authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized." },
      { status: 401 },
    );
  }

  const today = new Date();
  const reportDate = today.toISOString().slice(0, 10);

  try {
  const results = await runDailyReportsForUsers();

    const created = results.filter(
      (result) => result.status === "created",
    ).length;

    const skipped = results.filter(
      (result) => result.status === "skipped",
    ).length;

    const failed = results.filter(
      (result) => result.status === "failed",
    ).length;

    return NextResponse.json({
      ok: failed === 0,
      date: new Date().toISOString().slice(0, 10),
      summary: {
        total: results.length,
        created,
        skipped,
        failed,
      },
      results,
    });
console.info("Daily report job summary:", {
  total: results.length,
  created,
  skipped,
  failed,
  results,
});

  } catch (error) {
    console.error("Daily report job failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 },
    );
  }
}