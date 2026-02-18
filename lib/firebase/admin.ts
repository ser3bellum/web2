// lib/firebase/admin.ts
import "server-only";

import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { getFirestore } from "firebase-admin/firestore";

function loadServiceAccount() {
  const p = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!p) throw new Error("FIREBASE_SERVICE_ACCOUNT_PATH is not set");

  const absPath = path.isAbsolute(p) ? p : path.join(process.cwd(), p);
  if (!fs.existsSync(absPath)) {
    throw new Error(`Firebase service account not found at ${absPath}`);
  }

  return JSON.parse(fs.readFileSync(absPath, "utf8"));
}

if (!admin.apps.length) {
  const serviceAccount = loadServiceAccount();

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // projectId optional; fine either way
    projectId: serviceAccount.project_id,
  });
}

export const adminAuth = admin.auth();

// Named Firestore database (keep if intentional)
export const adminDb = getFirestore(admin.app(), "ser3bellum");

export default admin;

export function verifyIdToken(idToken: string) {
  return adminAuth.verifyIdToken(idToken);
}

export function createSessionCookie(idToken: string, expiresIn: number) {
  return adminAuth.createSessionCookie(idToken, { expiresIn });
}

export function verifySessionCookie(sessionCookie: string) {
  return adminAuth.verifySessionCookie(sessionCookie, true);
}
