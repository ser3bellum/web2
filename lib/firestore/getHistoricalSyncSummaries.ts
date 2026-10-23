import { adminDb } from "@/lib/firebase/admin";
import type { SyncSummaryDoc } from "@/lib/firestore/saveSyncSummary";

export async function getHistoricalSyncSummaries(
  workspaceId: string,
  limit = 7,
): Promise<SyncSummaryDoc[]> {
  const snap = await adminDb
    .collection("workspaces")
    .doc(workspaceId)
    .collection("syncSummaries")
    .orderBy("generatedAt", "desc")
    .limit(limit)
    .get();

  return snap.docs.map(
    (doc) => doc.data() as SyncSummaryDoc,
  );
}