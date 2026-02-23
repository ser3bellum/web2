// lib/data/getUserCompanyContext.ts
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export type UserDoc = {
  email?: string | null;
  name?: string | null;
  jobTitle?: string | null;
  // ✅ new model
  lastWorkspaceId?: string | null;

  // ✅ optional cached company bits (you sync these on save)
  companyName?: string | null;
  companySize?: string | null;
  country?: string | null;

  // ✅ avatar
  avatarUrl?: string | null;

  onboardingStatus?: string | null;
};

export type WorkspaceDoc = {
  name?: string | null;
  ownerUid?: string | null;
  website?: string | null;
  companySize?: string | null;
  activity?: string | null;
  vatId?: string | null;
  country?: string | null;
};

export async function getUserCompanyContext(sessionCookie: string): Promise<{
  uid: string;
  user: (UserDoc & { id: string }) | null;
  company: (WorkspaceDoc & { id: string }) | null;
}> {
  const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
  const uid = decoded.uid;

  const userSnap = await adminDb.collection("users").doc(uid).get();
  if (!userSnap.exists) return { uid, user: null, company: null };

  const user = { id: userSnap.id, ...(userSnap.data() as UserDoc) };

  // ✅ new: resolve company context from workspace
  const workspaceId = user.lastWorkspaceId;
  if (!workspaceId) return { uid, user, company: null };

  const wsSnap = await adminDb.collection("workspaces").doc(workspaceId).get();
  const company = wsSnap.exists
    ? ({ id: wsSnap.id, ...(wsSnap.data() as WorkspaceDoc) } as const)
    : null;

  return { uid, user, company };
}
