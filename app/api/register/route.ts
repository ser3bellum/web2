import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin"; // whatever you named your Admin init

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { email, password, name } = body;

		if (!email || !password) {
			return NextResponse.json(
				{ ok: false, error: "Missing email/password" },
				{ status: 400 },
			);
		}

		// MVP: write to Firestore (later you’ll create a Firebase Auth user too)
		const ref = adminDb.collection("users").doc(); // or doc(email) if you prefer
		await ref.set({
			email,
			name: name ?? null,
			createdAt: new Date(), // you can swap to FieldValue.serverTimestamp()
			onboardingStatus: "registered",
		});

		return NextResponse.json({ ok: true, userId: ref.id });
	} catch (e: any) {
		return NextResponse.json(
			{ ok: false, error: e?.message ?? "Unknown error" },
			{ status: 500 },
		);
	}
}
