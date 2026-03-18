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
  const raw = process.env.NEXT_PUBLIC_FIREBASE_WEBAPP_CONFIG;

  if (raw) {
    const parsed = JSON.parse(raw) as WebAppConfig;
    if (parsed?.apiKey && parsed?.authDomain && parsed?.projectId && parsed?.appId) {
      return parsed;
    }
    throw new Error("Invalid NEXT_PUBLIC_FIREBASE_WEBAPP_CONFIG JSON.");
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  console.log("firebase env debug", {
    hasRawConfig: !!raw,
    hasApiKey: !!apiKey,
    hasAuthDomain: !!authDomain,
    hasProjectId: !!projectId,
    hasAppId: !!appId,
  });

  if (!apiKey || !authDomain || !projectId || !appId) {
    throw new Error(
      "Missing Firebase web config. Set NEXT_PUBLIC_FIREBASE_WEBAPP_CONFIG or NEXT_PUBLIC_FIREBASE_*."
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
console.log("STAGING BUILD MARKER 2026-03-18-A");
const firebaseConfig = readWebConfig();

export const app: FirebaseApp =
  getApps().length > 0 ? getApps()[0]! : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
