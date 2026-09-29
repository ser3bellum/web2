import "server-only";

import { adminDb } from "@/lib/firebase/admin";

export type DailyReportUser = {
  uid: string;
  workspaceId: string;
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

    if (!workspaceId) {
      return [];
    }

    return [
      {
        uid: doc.id,
        workspaceId,
      },
    ];
  });
}