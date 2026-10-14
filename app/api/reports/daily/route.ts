
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getUserCompanyContext } from "@/lib/data/getUserCompanyContext";
import { runDailyReportCycle } from "@/lib/reports/runDailyReportCycle";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
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

    if (user.lastWorkspaceId !== company.id) {
      return NextResponse.json(
        { ok: false, error: "Active workspace not verified" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const from =
      typeof body?.from === "string"
        ? body.from.trim()
        : "";

    const to =
      typeof body?.to === "string"
        ? body.to.trim()
        : "";

    if (!from || !to) {
      return NextResponse.json(
        {
          ok: false,
          error: "from and to are required.",
        },
        { status: 400 }
      );
    }

    const result = await runDailyReportCycle({
      workspaceId: company.id,
      endUserId: user.id,
      from,
      to,
    });

    return NextResponse.json({
      ok: true,
      reportId: result.report.reportId,
      report: result.report,
    });
  } catch (error) {
    console.error("Daily report cycle failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to generate daily report.",
      },
      { status: 500 }
    );
  }
}
