import { NextResponse } from "next/server";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getAdminDb() {
	const appName = "ser3bellum-admin";

	const existingApp = getApps().find((app) => app.name === appName);

	const app =
		existingApp ??
		initializeApp(
			{
				credential: cert({
					projectId: process.env.FIREBASE_PROJECT_ID!,
					clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
					privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
				}),
			},
			appName
		);

	return getFirestore(app, "ser3bellum");
}

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const workspaceId = searchParams.get("workspaceId");

		if (!workspaceId) {
			return NextResponse.json(
				{ error: "Missing workspaceId" },
				{ status: 400 }
			);
		}

		const db = getAdminDb();

		const snapshot = await db
			.collection("workspaces")
			.doc(workspaceId)
			.collection("syncSummaries")
			.orderBy("generatedAt", "desc")
			.limit(1)
			.get();

		if (snapshot.empty) {
			return NextResponse.json({ report: null });
		}

		const doc = snapshot.docs[0];
		const data = doc.data();

		const signals = data.signals ?? {};

		const bullets: string[] = [];

		if (signals.sales) {
			bullets.push(
				`Sales: ${signals.sales.revenue ?? 0} ${
					signals.sales.currency ?? "EUR"
				} from ${signals.sales.orderCount ?? 0} orders`
			);
		}

		if (signals.analytics) {
			bullets.push(
				`Analytics: ${signals.analytics.sessions ?? 0} sessions during the selected period`
			);
		}

		if (signals.marketing) {
			bullets.push(
				`Marketing: ${signals.marketing.traffic ?? 0} visits${
					signals.marketing.delta ? ` (${signals.marketing.delta})` : ""
				}`
			);
		}

		if (signals.downtime) {
			bullets.push(
				`Downtime: ${signals.downtime.minutes ?? 0} minutes detected`
			);
		}

		if (signals.cpu) {
			bullets.push(`System: CPU usage at ${signals.cpu.usage ?? 0}%`);
		}

		const report = {
			date: data.generatedAt ?? new Date().toISOString(),
			headline: "Daily Ops Summary",
			bullets:
				bullets.length > 0
					? bullets
					: ["No major operational signals were detected."],
			reportId: data.syncRunId ?? doc.id,
		};

		return NextResponse.json({ report });
	} catch (error) {
		console.error("Failed to load latest summary:", error);

		return NextResponse.json(
			{ error: "Failed to load latest summary" },
			{ status: 500 }
		);
	}
}