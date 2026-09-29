import "server-only";

import { dailyReportExists } from "@/lib/firestore/dailyReportExists";
import { getDailyReportUsers } from "@/lib/reports/getDailyReportUsers";
import { runDailyReportCycle } from "@/lib/reports/runDailyReportCycle";

export type DailyReportRunResult = {
  uid: string;
  workspaceId: string;
  status: "created" | "skipped" | "failed";
  reportId?: string;
  error?: string;
};

export async function runDailyReportsForUsers(args: {
  from: string;
  to: string;
}): Promise<DailyReportRunResult[]> {
  const { from, to } = args;

  const users = await getDailyReportUsers();

   console.log(
    "Daily report users:",
    users.map((user) => ({
      uid: user.uid,
      workspaceId: user.workspaceId,
    })),
  );

  const results: DailyReportRunResult[] = [];

  for (const user of users) {
    try {
      // For now, reports use the UID as their operational
      // workspace namespace.
      const operationalWorkspaceId = user.uid;

      const exists = await dailyReportExists(
        operationalWorkspaceId,
        to,
      );

      if (exists) {
        results.push({
          uid: user.uid,
          workspaceId: user.workspaceId,
          status: "skipped",
        });

        continue;
      }

      const { report } = await runDailyReportCycle({
        workspaceId: operationalWorkspaceId,
        from,
        to,
      });

      results.push({
        uid: user.uid,
        workspaceId: user.workspaceId,
        status: "created",
        reportId: report.reportId,
      });
    } catch (error) {
      console.error(
        `Daily report cycle failed for user ${user.uid}:`,
        error,
      );

      results.push({
        uid: user.uid,
        workspaceId: user.workspaceId,
        status: "failed",
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      });
    }
  }

  return results;
}