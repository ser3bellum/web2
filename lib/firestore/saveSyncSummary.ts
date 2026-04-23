import { randomUUID } from "node:crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

export type SyncSummaryDoc = {
  workspaceId: string;
  syncRunId: string;
  syncSource: "manual_refresh" | "scheduled" | "login_refresh";
  connectorIds: string[];
  generatedAt: string;
  expiresAt: string;
  dateWindow: {
    from: string;
    to: string;
  };
  signals: {
    sales?: {
      revenue?: number | null;
      orderCount?: number | null;
      currency?: string | null;
    };
    analytics?: {
      sessions?: number | null;
    };
    marketing?: {
      traffic?: number | null;
      delta?: string | null;
    };
    downtime?: {
      minutes?: number | null;
    };
    cpu?: {
      usage?: number | null;
    };
  };
  connectorStatus: Record<
    string,
    {
      status: "connected" | "degraded" | "disconnected";
      lastSyncAt?: string | null;
      note?: string | null;
    }
  >;
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

export async function saveSyncSummary(
  input: Omit<SyncSummaryDoc, "syncRunId" | "generatedAt" | "expiresAt">
) {
  const db = getAdminDb();

  const syncRunId = randomUUID();
  const generatedAt = new Date().toISOString();
  const expiresAt = isoDaysFromNow(30);

  const doc: SyncSummaryDoc = {
    ...input,
    syncRunId,
    generatedAt,
    expiresAt,
  };

  const ref = db
    .collection("workspaces")
    .doc(input.workspaceId)
    .collection("syncSummaries")
    .doc(syncRunId);

  await ref.set(
    stripUndefinedDeep({
      ...doc,
      createdAt: FieldValue.serverTimestamp(),
    })
  );

  return doc;
}