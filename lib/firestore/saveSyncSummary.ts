import { randomUUID } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

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

    crm?: {
      leads?: number | null;
      opportunities?: number | null;
    };

    finance?: {
      amount?: number | null;
      currency?: string | null;
    };

    socialMedia?: {
      reach?: number | null;
      engagement?: number | null;
    };

    booking?: {
      reservations?: number | null;
      appointments?: number | null;
    };

    downtime?: {
      minutes?: number | null;
    };
  };

  businessSources?: {
    category:
      | "analytics"
      | "sales"
      | "marketing"
      | "crm"
      | "finance"
      | "socialMedia"
      | "booking"
      | "downtime";
    provider: string;
    providerConfigKey: string;
    status: "ok" | "warn" | "error" | "disabled";
    metrics: Record<string, number | string | null>;
  }[];

  connectorStatus: Record<
    string,
    {
      status: "connected" | "degraded" | "disconnected";
      lastSyncAt?: string | null;
      note?: string | null;
    }
  >;
};

function isoDaysFromNow(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
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
  input: Omit<
    SyncSummaryDoc,
    "syncRunId" | "generatedAt" | "expiresAt"
  >,
) {
  const syncRunId = randomUUID();
  const generatedAt = new Date().toISOString();
  const expiresAt = isoDaysFromNow(30);

  const doc: SyncSummaryDoc = {
    ...input,
    syncRunId,
    generatedAt,
    expiresAt,
  };

  const ref = adminDb
    .collection("workspaces")
    .doc(input.workspaceId)
    .collection("syncSummaries")
    .doc(syncRunId);

  await ref.set({
    ...stripUndefinedDeep(doc),
    createdAt: FieldValue.serverTimestamp(),
  });

  return doc;
}