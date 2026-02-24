// lib/firebase/bootstrap.ts

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

export type BootstrapInput = {
	uid: string;
	email: string | null;
	name?: string | null;
	companyName?: string | null;
	companySize?: string | null; // or number | null depending on your form
	country?: string | null;
};

export async function bootstrapUserAndWorkspace(params: {
	uid: string;
	email: string | null;
	name?: string | null;
	companyName?: string | null;
	companySize?: string | null; // or number | null depending on your form
	country?: string | null;
}) {
	const { uid, email, name, companyName } = params;

	const userRef = adminDb.collection("users").doc(uid);

	// 1️⃣ Check if user already has a workspace
	const userSnap = await userRef.get();
	const existingWorkspaceId = userSnap.exists
		? userSnap.data()?.lastWorkspaceId
		: null;

	if (existingWorkspaceId) {
		// Already bootstrapped → nothing to do
		return { workspaceId: existingWorkspaceId };
	}

	// 2️⃣ Create first workspace
	const workspaceRef = adminDb.collection("workspaces").doc();
	const workspaceId = workspaceRef.id;

	const batch = adminDb.batch();

	batch.set(
		userRef,
		{
			uid,
			email: email ?? "",
			name: name ?? "",
			lastWorkspaceId: workspaceId,
			createdAt: FieldValue.serverTimestamp(),
			updatedAt: FieldValue.serverTimestamp(),
		},
		{ merge: true },
	);

	batch.set(workspaceRef, {
		workspaceId,
		name: (companyName ?? "").trim() || "My company",
		ownerUid: uid,
		plan: "free",
		createdAt: FieldValue.serverTimestamp(),
		updatedAt: FieldValue.serverTimestamp(),
	});

	batch.set(workspaceRef.collection("members").doc(uid), {
		uid,
		role: "owner",
		joinedAt: FieldValue.serverTimestamp(),
	});

	// 3️⃣ Membership index (fast workspace listing)
	batch.set(
		adminDb
			.collection("users")
			.doc(uid)
			.collection("workspaces")
			.doc(workspaceId),
		{
			workspaceId,
			role: "owner",
			createdAt: FieldValue.serverTimestamp(),
		},
	);

	await batch.commit();

	return { workspaceId };
}
