import "server-only";

import { adminDb } from "@/lib/firebase/admin";

export async function dailyReportExists(
  workspaceId: string,
  reportDate: string,
): Promise<boolean> {
  const normalizedWorkspaceId = workspaceId.trim();
  const normalizedReportDate = reportDate.trim();

  if (!normalizedWorkspaceId || !normalizedReportDate) {
    return false;
  }

  const reportId = `daily_${normalizedReportDate}`;

  const snapshot = await adminDb
    .collection("workspaces")
    .doc(normalizedWorkspaceId)
    .collection("reports")
    .doc(reportId)
    .get();

  return snapshot.exists;
}