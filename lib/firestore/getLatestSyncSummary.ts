import { adminDb } from "@/lib/firebase/admin";
import type { SyncSummaryDoc } from "@/lib/firestore/saveSyncSummary";

export async function getLatestSyncSummary(
  workspaceId: string
): Promise<SyncSummaryDoc | null> {
  const snap = await adminDb
    .collection("workspaces")
    .doc(workspaceId)
    .collection("syncSummaries")
    .orderBy("generatedAt", "desc")
    .limit(1)
    .get();

  if (snap.empty) {
    return null;
  }

  return snap.docs[0].data() as SyncSummaryDoc;
}