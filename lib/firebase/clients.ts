// lib/firebase/clients.ts
import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
	apiKey: "AIzaSyBQ8K2iiGzcJwLkXzMSrcKD_TBFgRM1VVQ",
	authDomain: "ser3bellum-v2.firebaseapp.com",
	projectId: "ser3bellum-v2",
	storageBucket: "ser3bellum-v2.firebasestorage.app",
	messagingSenderId: "489714856216",
	appId: "1:489714856216:web:278e81286c2937f959ae6d",
};

// Prevent re-init
export const app =
	getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
