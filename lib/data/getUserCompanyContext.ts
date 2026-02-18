// lib/data/getUserCompanyContext.ts
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export type UserDoc = {
  email?: string | null;
  name?: string | null;
  companyId?: string | null;
  companyName?: string | null;
  onboardingStatus?: string | null;
};

export type CompanyDoc = {
  name?: string | null;
  ownerUid?: string | null;
};

export async function getUserCompanyContext(sessionCookie: string): Promise<{
  uid: string;
  user: (UserDoc & { id: string }) | null;
  company: (CompanyDoc & { id: string }) | null;
}> {
  const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
  const uid = decoded.uid;

  const userSnap = await adminDb.collection("users").doc(uid).get();
  if (!userSnap.exists) return { uid, user: null, company: null };

  const user = { id: userSnap.id, ...(userSnap.data() as UserDoc) };

  const companyId = user.companyId;
  if (!companyId) return { uid, user, company: null };

  const companySnap = await adminDb.collection("companies").doc(companyId).get();
  const company = companySnap.exists
    ? ({ id: companySnap.id, ...(companySnap.data() as CompanyDoc) } as const)
    : null;

  return { uid, user, company };
}
