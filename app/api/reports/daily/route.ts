import { NextResponse } from "next/server";

import { runDailyReportCycle } from "@/lib/reports/runDailyReportCycle";

export async function POST(req: Request) {
	try {
		const body = await req.json();

		const workspaceId =
			typeof body?.workspaceId === "string"
				? body.workspaceId.trim()
				: "";

		const from =
			typeof body?.from === "string"
				? body.from
				: "";

		const to =
			typeof body?.to === "string"
				? body.to
				: "";

		if (!workspaceId || !from || !to) {
			return NextResponse.json(
				{
					ok: false,
					error: "workspaceId, from and to are required.",
				},
				{ status: 400 },
			);
		}

		const result = await runDailyReportCycle({
			workspaceId,
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
				error:
					error instanceof Error
						? error.message
						: "Failed to generate daily report.",
			},
			{ status: 500 },
		);
	}
}