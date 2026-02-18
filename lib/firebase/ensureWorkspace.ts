// lib/firebase/ensureWorkspace.ts
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function ensureUserWorkspace(params: {
  uid: string;
  email?: string | null;
  name?: string | null;
}) {
  const { uid, email, name } = params;

  const userRef = adminDb.collection("users").doc(uid);
  const userSnap = await userRef.get();

  const existingWorkspaceId = userSnap.data()?.lastWorkspaceId;
  if (existingWorkspaceId) {
    return existingWorkspaceId;
  }

  // Create first workspace (standard default)
  const workspaceRef = adminDb.collection("workspaces").doc();
  const workspaceId = workspaceRef.id;

  const batch = adminDb.batch();

  batch.set(
    userRef,
    {
      uid,
      email: email ?? "",
      name: name ?? "",
      lastWorkspaceId: workspaceId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  batch.set(workspaceRef, {
    workspaceId,
    name: "My company",
    ownerUid: uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  batch.set(workspaceRef.collection("members").doc(uid), {
    uid,
    role: "owner",
    joinedAt: FieldValue.serverTimestamp(),
  });

  batch.set(
    userRef.collection("workspaces").doc(workspaceId),
    {
      workspaceId,
      role: "owner",
      createdAt: FieldValue.serverTimestamp(),
    }
  );

  await batch.commit();

  return workspaceId;
}
