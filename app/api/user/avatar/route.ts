export const runtime = "nodejs";

import { getStorage } from "firebase-admin/storage";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import admin, { adminDb, verifySessionCookie } from "@/lib/firebase/admin";

function jsonError(message: string, status = 400, extra?: Record<string, any>) {
	return NextResponse.json(
		{ ok: false, error: message, ...(extra ? { extra } : {}) },
		{ status },
	);
}

function pickExt(contentType?: string) {
	if (contentType === "image/png") return "png";
	if (contentType === "image/webp") return "webp";
	if (contentType === "image/jpeg") return "jpg";
	return "jpg";
}

export async function POST(req: Request) {
	console.log("[avatar] POST hit");

	try {
		// Auth
		const sessionCookie = (await cookies()).get("__Host-__Host-sb_auth")?.value;
		if (!sessionCookie) {
			console.log("[avatar] 401 no cookie");
			return jsonError("Not authenticated", 401);
		}

		let uid: string;
		try {
			const decoded = await verifySessionCookie(sessionCookie);
			uid = decoded.uid;
		} catch {
			console.log("[avatar] 401 invalid session");
			return jsonError("Invalid session", 401);
		}

		// Parse multipart form
		const form = await req.formData();
		const fileAny = form.get("file");

		if (!fileAny) {
			console.log("[avatar] 400 missing file");
			return jsonError("Missing file field 'file'", 400);
		}

		// In Next/Node, this may not always be a browser File instance.
		// So we validate by shape.
		const file = fileAny as unknown as {
			name?: string;
			type?: string;
			size?: number;
			arrayBuffer?: () => Promise<ArrayBuffer>;
		};

		if (typeof file.arrayBuffer !== "function") {
			console.log("[avatar] 400 invalid file payload", typeof fileAny);
			return jsonError("Invalid file payload", 400);
		}

		const contentType = file.type || "";
		const size = file.size ?? 0;

		if (!contentType.startsWith("image/")) {
			console.log("[avatar] 400 not image", contentType);
			return jsonError("File must be an image", 400, { contentType });
		}

		const maxBytes = 5 * 1024 * 1024; // 5MB
		if (size > maxBytes) {
			console.log("[avatar] 400 too large", size);
			return jsonError("Image too large (max 3MB)", 400, { size });
		}

		// Bucket
		const bucketName =
			process.env.FIREBASE_STORAGE_BUCKET ||
			(process.env.FIREBASE_PROJECT_ID
				? `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`
				: "");

		if (!bucketName) {
			console.log("[avatar] 500 missing bucket env");
			return jsonError(
				"Bucket not configured. Set FIREBASE_STORAGE_BUCKET (and optionally FIREBASE_PROJECT_ID).",
				500,
			);
		}

		const bucket = getStorage(admin.app()).bucket(bucketName);

		// Upload
		const buffer = Buffer.from(await file.arrayBuffer());
		const ext = pickExt(contentType);
		const objectPath = `avatars/${uid}.${ext}`;
		const object = bucket.file(objectPath);

		await object.save(buffer, {
			resumable: false,
			metadata: {
				contentType,
				cacheControl: "public, max-age=3600",
			},
		});

		// Signed URL (works even if bucket is private)
		const [signedUrl] = await object.getSignedUrl({
			action: "read",
			expires: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days
		});

		// Save to user doc
		await adminDb.collection("users").doc(uid).set(
			{
				avatarUrl: signedUrl,
				avatarPath: objectPath,
				updatedAt: new Date(),
			},
			{ merge: true },
		);

		console.log("[avatar] uploaded OK", { uid, objectPath });

		return NextResponse.json({ ok: true, avatarUrl: signedUrl });
	} catch (err: any) {
		console.error("[avatar] ERROR", err?.stack || err);
		return jsonError("Upload failed (server error)", 500, {
			message: err?.message || String(err),
		});
	}
}
