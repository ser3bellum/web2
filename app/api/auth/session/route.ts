// app/api/auth/session/route.ts
export const runtime = "nodejs";

import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import {
	adminDb,
	createSessionCookie,
	verifyIdToken,
} from "@/lib/firebase/admin";

function cleanString(v: unknown) {
	if (typeof v !== "string") return undefined;
	const s = v.trim();
	return s.length ? s : undefined;
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { idToken, profile } = body ?? {};

		if (!idToken) {
			return NextResponse.json(
				{ ok: false, error: "Missing idToken" },
				{ status: 400 },
			);
		}

		const decoded = await verifyIdToken(idToken);
		const uid = decoded.uid;
		const email = decoded.email ?? null;
		const tokenName = decoded.name ?? null;

		const userRef = adminDb.collection("users").doc(uid);

		// Fetch existing user doc so we can:
		// - keep createdAt stable
		// - avoid overwriting profile on login
		// - avoid creating duplicate companies
		const userSnap = await userRef.get();
		const isNewUser = !userSnap.exists;

		const existingUser = userSnap.exists ? (userSnap.data() as any) : null;
		const existingCompanyId: string | undefined = existingUser?.companyId;

		// Always update lastLoginAt (safe)
		const baseUpdate: Record<string, any> = {
			email,
			lastLoginAt: FieldValue.serverTimestamp(),
		};

		// Only set createdAt once
		if (isNewUser) {
			baseUpdate.createdAt = FieldValue.serverTimestamp();
			baseUpdate.onboardingStatus = "registered";
		}

		// If profile is provided (signup flow), merge in profile fields WITHOUT writing nulls
		const hasProfile = profile && typeof profile === "object";

		if (hasProfile) {
			const p = profile as Record<string, unknown>;
			const profileUpdate: Record<string, any> = {};

			const name = cleanString(p.name) ?? cleanString(tokenName);
			if (name) profileUpdate.name = name;

			const companyName = cleanString(p.companyName);
			if (companyName) profileUpdate.companyName = companyName;

			const companySize = cleanString(p.companySize);
			if (companySize) profileUpdate.companySize = companySize;

			const country = cleanString(p.country);
			if (country) profileUpdate.country = country;

			// ✅ NEW: Create + link company if missing companyId
			// Only do this if we have a companyName (otherwise we can't create a meaningful company doc)
			if (!existingCompanyId && companyName) {
				const companyRef = adminDb.collection("companies").doc(); // auto id
				await companyRef.set(
					{
						name: companyName,
						ownerUid: uid,
						createdAt: FieldValue.serverTimestamp(),
					},
					{ merge: true },
				);

				profileUpdate.companyId = companyRef.id; // link user -> company
			}

			await userRef.set(
				{
					...baseUpdate,
					...profileUpdate,
				},
				{ merge: true },
			);
		} else {
			// Login flow: do NOT touch profile fields
			await userRef.set(baseUpdate, { merge: true });
		}

		// Session cookie
		const expiresIn = 14 * 24 * 60 * 60 * 1000;
		const sessionCookie = await createSessionCookie(idToken, expiresIn);

		const res = NextResponse.json({ ok: true });

		res.cookies.set("sb_auth", sessionCookie, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
			maxAge: Math.floor(expiresIn / 1000),
		});

		return res;
	} catch (err: any) {
		console.error("SESSION_ERROR:", err);
		return NextResponse.json(
			{
      ok: false,
      error: err?.message ?? "Failed to create session",
      code: err?.code ?? null,
      name: err?.name ?? null,
    },
    { status: 500 },
		);
	}
}
