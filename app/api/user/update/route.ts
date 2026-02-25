export const runtime = "nodejs";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminDb, verifySessionCookie } from "@/lib/firebase/admin";

function cleanString(v: unknown, max = 120) {
	if (typeof v !== "string") return undefined;
	const s = v.trim();
	if (!s) return undefined;
	return s.slice(0, max);
}

export async function POST(req: Request) {
	const sessionCookie = (await cookies()).get("__Host-__Host-sb_auth")?.value;
	if (!sessionCookie) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	let uid: string;
	try {
		const decoded = await verifySessionCookie(sessionCookie);
		uid = decoded.uid;
	} catch {
		return NextResponse.json({ error: "Invalid session" }, { status: 401 });
	}

	const body = await req.json().catch(() => null);
	if (!body) {
		return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	const name = cleanString(body.name, 120);
	const jobTitle = cleanString(body.jobTitle, 80); // ✅ ADD THIS

	const payload = Object.fromEntries(
		Object.entries({
			name,
			jobTitle, // ✅ ADD THIS
			updatedAt: new Date(),
		}).filter(([, v]) => v !== undefined),
	);

	await adminDb.collection("users").doc(uid).set(payload, { merge: true });

	const snap = await adminDb.collection("users").doc(uid).get();

	return NextResponse.json({
		ok: true,
		user: snap.exists ? (snap.data() ?? null) : null,
	});
}
