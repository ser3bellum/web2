// lib/firebase/clients.ts
import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

type WebConfig = {
	apiKey: string;
	authDomain: string;
	projectId: string;
	appId: string;
	storageBucket?: string;
	messagingSenderId?: string;
};

function loadFirebaseWebConfig(): WebConfig {
	// ✅ Firebase App Hosting injects this (we saw it in your build logs)
	const raw = process.env.FIREBASE_WEBAPP_CONFIG;
	if (raw) {
		try {
			const cfg = JSON.parse(raw) as Partial<WebConfig>;
			if (cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId) {
				return cfg as WebConfig;
			}
		} catch {
			// fall through to NEXT_PUBLIC config
		}
	}

	// ✅ Local dev fallback (.env.local)
	const cfg: Partial<WebConfig> = {
		apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
		authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
		projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
		appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
		storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
		messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	};

	const missing = ["apiKey", "authDomain", "projectId", "appId"].filter(
		(k) => !(cfg as any)[k],
	);

	if (missing.length) {
		throw new Error(
			`Missing Firebase web config: ${missing.join(
				", ",
			)}. Provide FIREBASE_WEBAPP_CONFIG (App Hosting) or NEXT_PUBLIC_FIREBASE_* (local).`,
		);
	}

	return cfg as WebConfig;
}

const firebaseConfig = loadFirebaseWebConfig();

// Prevent re-init across hot reload / multiple imports
export const app =
	getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
