// lib/firebase/clients.ts
import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

type WebAppConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  storageBucket?: string;
  messagingSenderId?: string;
};

function readWebConfig(): WebAppConfig {
  // ✅ Client-safe: Next will inline this at build time
  const raw = process.env.NEXT_PUBLIC_FIREBASE_WEBAPP_CONFIG;

  if (raw) {
    const parsed = JSON.parse(raw) as WebAppConfig;
    if (parsed?.apiKey && parsed?.authDomain && parsed?.projectId && parsed?.appId) return parsed;
  }

  // ✅ Local dev fallback (.env.local)
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  if (!apiKey || !authDomain || !projectId || !appId) {
    throw new Error(
      "Missing Firebase web config. Set NEXT_PUBLIC_FIREBASE_WEBAPP_CONFIG (recommended) or NEXT_PUBLIC_FIREBASE_*."
    );
  }

  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  };
}

const firebaseConfig = readWebConfig();

export const app: FirebaseApp =
  getApps().length > 0 ? getApps()[0]! : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);