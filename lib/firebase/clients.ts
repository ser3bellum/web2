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
  // Firebase App Hosting injects this (stringified JSON)
  const fromAppHosting = process.env.FIREBASE_WEBAPP_CONFIG;
  if (fromAppHosting) {
    const parsed = JSON.parse(fromAppHosting) as WebAppConfig;
    if (parsed?.apiKey && parsed?.authDomain && parsed?.projectId && parsed?.appId) return parsed;
  }

  // Local dev fallback (.env.local)
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  if (!apiKey || !authDomain || !projectId || !appId) {
    throw new Error(
      "Missing Firebase web config: set FIREBASE_WEBAPP_CONFIG (App Hosting) or NEXT_PUBLIC_FIREBASE_* (local)."
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