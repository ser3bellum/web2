import { randomUUID } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { AIInsightPayload } from "@/types/ai";

export type SavedAIInsightDoc = AIInsightPayload & {
  workspaceId: string;
  insightId: string;
  syncRunId: string | null;
  source: "adk" | "gemini" | "fallback";
  createdAtIso: string;
  expiresAt: string;
};

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item)) as T;
  }

  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};

    for (const [key, val] of Object.entries(value)) {
      if (val !== undefined) {
        result[key] = stripUndefinedDeep(val);
      }
    }

    return result as T;
  }

  return value;
}

export async function saveAIInsight(args: {
  workspaceId: string;
  syncRunId?: string | null;
  source: "adk" | "gemini" | "fallback";
  payload: AIInsightPayload;
}) {
  const db = adminDb;

  const insightId = randomUUID();
  const createdAtIso = new Date().toISOString();
  const expiresAt = isoDaysFromNow(30);

  const doc: SavedAIInsightDoc = {
    ...args.payload,
    workspaceId: args.workspaceId,
    insightId,
    syncRunId: args.syncRunId ?? null,
    source: args.source,
    createdAtIso,
    expiresAt,
  };

  const ref = db
    .collection("workspaces")
    .doc(args.workspaceId)
    .collection("aiInsights")
    .doc(insightId);

  await ref.set(
    stripUndefinedDeep({
      ...doc,
      createdAt: FieldValue.serverTimestamp(),
    })
  );

  return doc;

}

export async function getLatestAIInsight(
  workspaceId: string
): Promise<SavedAIInsightDoc | null> {
  const db = adminDb;

  const snapshot = await db
    .collection("workspaces")
    .doc(workspaceId)
    .collection("aiInsights")
    .orderBy("createdAtIso", "desc")
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data() as SavedAIInsightDoc;
}
