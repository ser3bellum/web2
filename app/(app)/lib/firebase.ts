import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

type WebAppConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  storageBucket?: string;
  messagingSenderId?: string;
};

function getWebAppConfig(): WebAppConfig {
  const raw = process.env.NEXT_PUBLIC_FIREBASE_WEBAPP_CONFIG;

  if (raw) {
    const parsed = JSON.parse(raw) as Partial<WebAppConfig>;
    if (!parsed.apiKey) throw new Error("NEXT_PUBLIC_FIREBASE_WEBAPP_CONFIG missing apiKey");
    if (!parsed.authDomain) throw new Error("NEXT_PUBLIC_FIREBASE_WEBAPP_CONFIG missing authDomain");
    if (!parsed.projectId) throw new Error("NEXT_PUBLIC_FIREBASE_WEBAPP_CONFIG missing projectId");
    if (!parsed.appId) throw new Error("NEXT_PUBLIC_FIREBASE_WEBAPP_CONFIG missing appId");
    return parsed as WebAppConfig;
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  if (!apiKey || !authDomain || !projectId || !appId) {
    throw new Error(
      "Firebase web config missing. Set NEXT_PUBLIC_FIREBASE_WEBAPP_CONFIG or NEXT_PUBLIC_FIREBASE_*."
    );
  }

  return {
    apiKey,
    authDomain,
    projectId,
    appId,
  };
}

const firebaseConfig = getWebAppConfig();

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export default app;
