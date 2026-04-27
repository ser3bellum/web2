import { randomUUID } from "node:crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import type { AIInsightPayload } from "@/types/ai";

export type SavedAIInsightDoc = AIInsightPayload & {
  workspaceId: string;
  insightId: string;
  syncRunId: string | null;
  source: "gemini" | "fallback";
  createdAtIso: string;
  expiresAt: string;
};

function getAdminDb() {
  const appName = "ser3bellum-admin";

  const existingApp = getApps().find((app) => app.name === appName);

  const app =
    existingApp ??
    initializeApp(
      {
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID!,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
          privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
        }),
      },
      appName
    );

  return getFirestore(app, "ser3bellum");
}

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
  source: "gemini" | "fallback";
  payload: AIInsightPayload;
}) {
  const db = getAdminDb();

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