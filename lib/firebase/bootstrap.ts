import admin from "@/lib/firebase/admin";
import { adminDb } from "@/lib/firebase/admin";

export async function bootstrapUserAndWorkspace(params: {
  uid: string;
  email: string | null;
  name?: string | null;
  companyName?: string | null;
  companySize?: string | null;
  country?: string | null;
}) {
  const { uid, email, name, companyName, companySize, country } = params;

  const userRef = adminDb.collection("users").doc(uid);

  // Create a default workspace
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
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  batch.set(workspaceRef, {
    name: (companyName ?? "").trim() || "My workspace",
    ownerUid: uid,
    companySize: companySize ?? "",
    country: country ?? "",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  batch.set(workspaceRef.collection("members").doc(uid), {
    role: "owner",
    joinedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return { workspaceId };
}
