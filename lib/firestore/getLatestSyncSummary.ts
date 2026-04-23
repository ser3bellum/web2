import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { SyncSummaryDoc } from "@/lib/firestore/saveSyncSummary";

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

export async function getLatestSyncSummary(
  workspaceId: string
): Promise<SyncSummaryDoc | null> {
  const db = getAdminDb();

  const snap = await db
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