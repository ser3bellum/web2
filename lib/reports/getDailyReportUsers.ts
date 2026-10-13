
import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

export type DailyReportUser = {
  uid: string;
  workspaceId: string;
  createdAt: Date;
};

export async function getDailyReportUsers(): Promise<
  DailyReportUser[]
> {
  const snapshot = await adminDb
    .collection("users")
    .get();

  return snapshot.docs.flatMap((doc) => {
    const data = doc.data();

    const workspaceId =
      typeof data.lastWorkspaceId === "string"
        ? data.lastWorkspaceId.trim()
        : "";

    const createdAt =
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate()
        : null;

    if (!workspaceId || !createdAt) {
      return [];
    }

    return [
      {
        uid: doc.id,
        workspaceId,
        createdAt,
      },
    ];
  });
}
