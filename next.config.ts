import type { NextConfig } from "next";

const webappConfig = process.env.FIREBASE_WEBAPP_CONFIG
	? JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG)
	: null;

const nextConfig: NextConfig = {
	// Expose Firebase Web config to the browser bundle on Firebase App Hosting.
	// Locally, you can still override with .env.local if you want.
	env: {
		NEXT_PUBLIC_FIREBASE_API_KEY:
			process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? webappConfig?.apiKey,
		NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
			process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? webappConfig?.authDomain,
		NEXT_PUBLIC_FIREBASE_PROJECT_ID:
			process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? webappConfig?.projectId,
		NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
			process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
			webappConfig?.storageBucket,
		NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
			process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ??
			webappConfig?.messagingSenderId,
		NEXT_PUBLIC_FIREBASE_APP_ID:
			process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? webappConfig?.appId,
	},
};

export default nextConfig;
