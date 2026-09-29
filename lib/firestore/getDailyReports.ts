import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import type { DailyReportDoc } from "@/lib/reports/types";

export async function getDailyReports(
  workspaceId: string,
): Promise<DailyReportDoc[]> {
  const normalizedWorkspaceId = workspaceId.trim();

  if (!normalizedWorkspaceId) {
    return [];
  }

  const snapshot = await adminDb
	.collection("workspaces")
	.doc(normalizedWorkspaceId)
	.collection("reports")
	.orderBy("generatedAt", "desc")
	.get();
  return snapshot.docs.map(
    (doc) => doc.data() as DailyReportDoc,
  );
}