import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import type { SavedAIInsightDoc } from "@/lib/firestore/saveAIInsight";

export async function getLatestSavedAIInsight(
  workspaceId: string,
): Promise<SavedAIInsightDoc | null> {
  const normalizedWorkspaceId = workspaceId.trim();

  if (!normalizedWorkspaceId) {
    return null;
  }

  const snapshot = await adminDb
    .collection("workspaces")
    .doc(normalizedWorkspaceId)
    .collection("aiInsights")
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const insight = snapshot.docs[0].data() as SavedAIInsightDoc;

  const expiresAt = Date.parse(insight.expiresAt);

  if (
    Number.isFinite(expiresAt) &&
    expiresAt <= Date.now()
  ) {
    return null;
  }

  return insight;
}