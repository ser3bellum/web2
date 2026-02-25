// app/api/auth/ensure-bootstrap/route.ts
export const runtime = "nodejs";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db, verifySessionCookie } from "@/lib/firebase/admin";
import { bootstrapUserAndWorkspace } from "@/lib/firebase/bootstrap";

export async function POST(req: Request) {
	try {
		const cookieStore = await cookies();
		const session = cookieStore.get("__Host-__Host-sb_auth")?.value;

		if (!session) {
			return NextResponse.json(
				{ ok: false, error: "Missing session" },
				{ status: 401 },
			);
		}

		const decoded = await verifySessionCookie(session);
		const uid = decoded.uid;

		// if user doc exists, we’re done
		const userSnap = await db.collection("users").doc(uid).get();
		if (userSnap.exists) {
			return NextResponse.json({ ok: true, alreadyBootstrapped: true });
		}

		// optional: accept metadata (name/company) if you want
		const body = await req.json().catch(() => ({}));
		const { name, companyName, companySize, country } = body ?? {};

		const result = await bootstrapUserAndWorkspace({
			uid,
			email: decoded.email ?? null,
			name,
			companyName,
			companySize,
			country,
		});

		return NextResponse.json({
			ok: true,
			alreadyBootstrapped: false,
			...result,
		});
	} catch (err: any) {
		console.error("ENSURE_BOOTSTRAP_ERROR:", err);
		return NextResponse.json(
			{ ok: false, error: err?.message ?? "ensure-bootstrap failed" },
			{ status: 500 },
		);
	}
}
