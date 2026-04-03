// lib/data/getUserCompanyContext.ts
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { getUserLanguageFromDoc } from "@/lib/i18n/getUserLanguage";
import type { SupportedLanguage } from "@/lib/i18n/config";

export type UserDoc = {
  email?: string | null;
  name?: string | null;
  jobTitle?: string | null;

  // workspace model
  lastWorkspaceId?: string | null;

  // legacy/company model fallback
  companyId?: string | null;

  // cached bits
  companyName?: string | null;
  companySize?: string | null;
  country?: string | null;

  avatarUrl?: string | null;
  onboardingStatus?: string | null;

  initialLanguage?: string | null;

  settings?: {
    localization?: {
      language?: string | null;
    };
  };
};

export type UserContextDoc = UserDoc & {
  id: string;
  initialLanguage: SupportedLanguage;
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

// We return "company" but it may come from workspaces OR companies
export type CompanyContextDoc = WorkspaceDoc & {
  id: string;
};

export async function getUserCompanyContext(
  sessionCookie: string,
): Promise<{
  uid: string;
  user: UserContextDoc | null;
  company: CompanyContextDoc | null;
}> {
  // 1) Verify session
  const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
  const uid = decoded.uid;

  // 2) Load user
  const userSnap = await adminDb.collection("users").doc(uid).get();
  if (!userSnap.exists) {
    return { uid, user: null, company: null };
  }

  const rawUser = userSnap.data() as UserDoc;
  const initialLanguage = getUserLanguageFromDoc(rawUser);

  const user: UserContextDoc = {
    id: userSnap.id,
    ...rawUser,
    initialLanguage,
  };

  // 3) Prefer workspace model
  const workspaceId = user.lastWorkspaceId ?? null;
  if (workspaceId) {
    const wsSnap = await adminDb.collection("workspaces").doc(workspaceId).get();

    if (wsSnap.exists) {
      return {
        uid,
        user,
        company: {
          id: wsSnap.id,
          ...(wsSnap.data() as WorkspaceDoc),
        },
      };
    }
  }

  // 4) Fallback: companyId -> companies
  const companyId = user.companyId ?? null;
  if (companyId) {
    const cSnap = await adminDb.collection("companies").doc(companyId).get();

    if (cSnap.exists) {
      return {
        uid,
        user,
        company: {
          id: cSnap.id,
          ...(cSnap.data() as WorkspaceDoc),
        },
      };
    }
  }

  // 5) No linked org yet
  return { uid, user, company: null };
}