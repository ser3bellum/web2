
import "server-only";

import { dailyReportExists } from "@/lib/firestore/dailyReportExists";
import { getDailyReportUsers } from "@/lib/reports/getDailyReportUsers";
import { getReportingWindow } from "@/lib/reports/getReportingWindow";
import { runDailyReportCycle } from "@/lib/reports/runDailyReportCycle";

export type DailyReportRunResult = {
  uid: string;
  workspaceId: string;
  status: "created" | "skipped" | "failed";
  reportId?: string;
  error?: string;
};

export async function runDailyReportsForUsers(): Promise<
  DailyReportRunResult[]
> {
  const users = await getDailyReportUsers();
  const now = new Date();

  const results: DailyReportRunResult[] = [];

  for (const user of users) {
    try {
      const window = getReportingWindow(user.createdAt, now);

      if (!window.isDue) {
        results.push({
          uid: user.uid,
          workspaceId: user.workspaceId,
          status: "skipped",
        });
        continue;
      }

      const operationalWorkspaceId = user.uid;

      const exists = await dailyReportExists(
        operationalWorkspaceId,
        window.to,
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
        from: window.from,
        to: window.to,
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
