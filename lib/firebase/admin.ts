// lib/firebase/admin.ts
import "server-only";

import fs from "node:fs";
import path from "node:path";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

function loadServiceAccount() {
  const p = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!p) return null;

  const absPath = path.isAbsolute(p) ? p : path.join(process.cwd(), p);
  if (!fs.existsSync(absPath)) {
    throw new Error(`Firebase service account not found at ${absPath}`);
  }

  return JSON.parse(fs.readFileSync(absPath, "utf8"));
}

if (!admin.apps.length) {
  const serviceAccount = loadServiceAccount();

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  } else {
    // Firebase App Hosting / Cloud Run: use ADC (runtime service account)
    admin.initializeApp();
  }
}

export const adminAuth = admin.auth();
export const adminDb = getFirestore();
export const db = adminDb;
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
