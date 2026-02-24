import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const missing = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (missing.length) {
  // This will show up in browser console on staging and tell us immediately what's missing.
  console.error("Missing Firebase config:", missing, firebaseConfig);
  throw new Error(`Missing Firebase config: ${missing.join(", ")}`);
}
console.log("FIREBASE apiKey (first 10)", firebaseConfig.apiKey?.slice(0, 10));
console.log("FIREBASE authDomain", firebaseConfig.authDomain);
console.log("FIREBASE projectId", firebaseConfig.projectId);
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);