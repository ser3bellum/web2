// app/api/company/update/route.ts
export const runtime = "nodejs";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminDb, verifySessionCookie } from "@/lib/firebase/admin";
import { ensureUserWorkspace } from "@/lib/firebase/ensureWorkspace";

function cleanString(v: unknown, max = 160) {
	if (typeof v !== "string") return undefined;
	const s = v.trim();
	if (!s) return undefined;
	return s.slice(0, max);
}

function cleanUrl(v: unknown) {
	const s = cleanString(v, 300);
	if (!s) return undefined;
	if (!/^https?:\/\//i.test(s)) return `https://${s}`;
	return s;
}

// Encrypt API keys before storing (uses COMPANY_SECRETS_KEY base64, 32 bytes decoded)
function encryptSecret(plaintext: string) {
	const keyB64 = process.env.COMPANY_SECRETS_KEY;
	if (!keyB64) throw new Error("COMPANY_SECRETS_KEY is not set");

	const key = Buffer.from(keyB64, "base64");
	if (key.length !== 32) {
		throw new Error("COMPANY_SECRETS_KEY must decode to 32 bytes");
	}

	const iv = crypto.randomBytes(12);
	const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

	const ciphertext = Buffer.concat([
		cipher.update(plaintext, "utf8"),
		cipher.final(),
	]);
	const tag = cipher.getAuthTag();

	return {
		v: 1,
		alg: "aes-256-gcm",
		iv: iv.toString("base64"),
		tag: tag.toString("base64"),
		data: ciphertext.toString("base64"),
	};
}

export async function POST(req: Request) {
	// 1) Auth via session cookie
	const sessionCookie = (await cookies()).get("__Host-sb_auth")?.value;
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

	// 2) Parse body
	const body = await req.json().catch(() => null);
	if (!body) {
		return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	// 3) Ensure the user has a workspace
	const workspaceId = await ensureUserWorkspace({ uid });

	// 4) Update company/workspace profile fields
	const updateWorkspace = {
		name: cleanString(body.companyName, 120),
		website: cleanUrl(body.website),
		companySize: cleanString(body.companySize, 40),
		activity: cleanString(body.companyActivity, 80),
		vatId: cleanString(body.vatId, 60),
		country: cleanString(body.country, 80),
		updatedAt: new Date(),
	};

	const workspacePayload = Object.fromEntries(
		Object.entries(updateWorkspace).filter(([, v]) => v !== undefined),
	);

	await adminDb
		.collection("workspaces")
		.doc(workspaceId)
		.set(workspacePayload, { merge: true });

	await adminDb
		.collection("users")
		.doc(uid)
		.set(
			{
				// cached company info for UI convenience
				companyName: workspacePayload.name ?? body.companyName ?? null,
				companySize: workspacePayload.companySize ?? body.companySize ?? null,
				country: workspacePayload.country ?? body.country ?? null,

				// always keep pointer updated
				lastWorkspaceId: workspaceId,

				updatedAt: new Date(),
			},
			{ merge: true },
		);

	// 5) Optional: encrypted API keys (apiKeys: { provider: "secret" })
	const apiKeys = body.apiKeys as Record<string, unknown> | undefined;

	if (apiKeys && typeof apiKeys === "object") {
		const batch = adminDb.batch();
		const secretsCol = adminDb
			.collection("workspaces")
			.doc(workspaceId)
			.collection("secrets");

		for (const [provider, raw] of Object.entries(apiKeys)) {
			if (typeof raw !== "string") continue;
			const token = raw.trim();
			if (!token) continue;

			batch.set(
				secretsCol.doc(provider),
				{
					provider,
					encrypted: encryptSecret(token),
					updatedAt: new Date(),
					updatedBy: uid,
				},
				{ merge: true },
			);
		}

		await batch.commit();
	}

	// ✅ Read back updated workspace for the UI
	const wsSnap = await adminDb.collection("workspaces").doc(workspaceId).get();

	return NextResponse.json({
		ok: true,
		workspaceId,
		workspace: wsSnap.data() ?? null,
	});
}
