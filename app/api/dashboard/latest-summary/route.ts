import { getUserCompanyContext } from "@/lib/data/getUserCompanyContext";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Timestamp } from "firebase-admin/firestore";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function getAdminDb() {
	const appName = "ser3bellum-admin";
	const existingApp = getApps().find((app) => app.name === appName);
	const privateKey = process.env.FIREBASE_PRIVATE_KEY;

	if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
		throw new Error("Firebase Admin environment is incomplete");
	}

	const app = existingApp ?? initializeApp(
		{
			credential: cert({
				projectId: process.env.FIREBASE_PROJECT_ID,
				clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
				privateKey: privateKey.replace(/\\n/g, "\n"),
			}),
		},
		appName,
	);

	return getFirestore(app, "ser3bellum");
}

function finiteNumber(value: unknown) {
	const number = typeof value === "number" ? value : Number(value);
	return Number.isFinite(number) ? number : 0;
}

function isoDate(value: unknown) {
	if (typeof value === "string") {
		const date = new Date(value);
		if (!Number.isNaN(date.getTime())) return date.toISOString();
	}
	if (value && typeof value === "object" && "toDate" in value) {
		return (value as Timestamp).toDate().toISOString();
	}
	return new Date().toISOString();
}

function integer(value: number) {
	return new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);
}

		export async function GET(request: Request) {
		try {
		const session = (await cookies()).get("__Host-sb_auth")?.value;
		if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

		const { user } = await getUserCompanyContext(session);

		const { searchParams } = new URL(request.url);
		const workspaceId = searchParams.get("workspaceId");

		if (!workspaceId) {
  		return NextResponse.json(
    	{ error: "Missing workspaceId" },
    	{ status: 400 },
  			);
		}

		if (!user?.id || workspaceId !== user.id) {
  		return NextResponse.json(
   		{ error: "Forbidden" },
    	{ status: 403 },
  			);
		}
		const snapshot = await getAdminDb()
			.collection("workspaces")
			.doc(workspaceId)
			.collection("syncSummaries")
			.orderBy("generatedAt", "desc")
			.limit(1)
			.get();

		if (snapshot.empty) return NextResponse.json({ report: null });

		const document = snapshot.docs[0];
		const data = document.data();
		const signals = data.signals ?? {};
		const revenue = finiteNumber(signals.sales?.revenue);
		const orders = finiteNumber(signals.sales?.orderCount);
		const sessions = finiteNumber(signals.analytics?.sessions);
		const visits = finiteNumber(signals.marketing?.traffic);
		const downtime = finiteNumber(signals.downtime?.minutes);
		const cpu = finiteNumber(signals.cpu?.usage);
		const currency = typeof signals.sales?.currency === "string" ? signals.sales.currency : "EUR";

		const bullets: string[] = [];
		if (signals.sales) bullets.push(`Sales: ${revenue} ${currency} from ${orders} orders`);
		if (signals.analytics) bullets.push(`Analytics: ${sessions} sessions during the selected period`);
		if (signals.marketing) bullets.push(`Marketing: ${visits} visits${signals.marketing.delta ? ` (${signals.marketing.delta})` : ""}`);
		if (signals.downtime) bullets.push(`Downtime: ${downtime} minutes detected`);
		if (signals.cpu) bullets.push(`System: CPU usage at ${cpu}%`);

		const activity = [
			signals.analytics ? { label: "Sessions", value: sessions, displayValue: integer(sessions) } : null,
			signals.marketing ? { label: "Visits", value: visits, displayValue: integer(visits) } : null,
			signals.sales ? { label: "Orders", value: orders, displayValue: integer(orders) } : null,
		].filter((item): item is NonNullable<typeof item> => item !== null);

		const health = [
			signals.cpu ? {
				label: "CPU usage",
				value: cpu,
				max: 100,
				displayValue: `${integer(cpu)}%`,
				tone: cpu >= 90 ? "critical" as const : cpu >= 70 ? "warning" as const : "good" as const,
			} : null,
			signals.downtime ? {
				label: "Downtime",
				value: downtime,
				max: Math.max(60, downtime),
				displayValue: `${integer(downtime)} min`,
				tone: downtime >= 30 ? "critical" as const : downtime > 0 ? "warning" as const : "good" as const,
			} : null,
		].filter((item): item is NonNullable<typeof item> => item !== null);

		const detectedCount = bullets.length;
		const fallbackSummary = detectedCount
			? `Ser3bellum combined ${detectedCount} fresh operational signals. Review the activity and health indicators below, then open the full report for source-level detail.`
			: "No major operational changes were detected in the latest synchronization.";
		const storedAiSummary = typeof data.aiSummary === "string"
			? data.aiSummary
			: typeof data.aiSummary?.summary === "string"
				? data.aiSummary.summary
				: null;
		const storedSummary = typeof data.summary === "string" ? data.summary : null;

		return NextResponse.json({
			report: {
				date: isoDate(data.generatedAt),
				headline: typeof data.headline === "string" ? data.headline : "Daily operations summary",
				summary: storedAiSummary ?? storedSummary ?? fallbackSummary,
				summaryLabel: storedAiSummary ? "AI summary" : "Operational summary",
				bullets: bullets.length ? bullets : ["No major operational signals were detected."],
				activity,
				health,
				reportId: typeof data.syncRunId === "string" ? data.syncRunId : document.id,
			},
		}, { headers: { "Cache-Control": "private, no-store" } });
	} catch (error) {
		console.error("Failed to load latest summary:", error);
		return NextResponse.json({ error: "Failed to load latest summary" }, { status: 500 });
	}
}
