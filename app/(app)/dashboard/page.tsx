// app/(app)/dashboard/page.tsx

import DashboardCardsGrid from "app/(app)/components/DashboardCardsGrid";
import { getDashboardKpis } from "app/(app)/dashboard/dashboardKpis";
import { parseDashboardRange } from "app/(app)/lib/dateRange";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type React from "react";
import type { ReactNode } from "react";
import { getUserCompanyContext } from "@/lib/data/getUserCompanyContext";
import { KpiStrip } from "./KpiStrip";

type DashboardSearchParams = { from?: string; to?: string };

export default async function DashboardPage({
	searchParams,
}: {
	// ✅ Works whether Next hands you an object OR a Promise (no more runtime errors)
	searchParams?: DashboardSearchParams | Promise<DashboardSearchParams>;
}) {
	// ✅ unwrap safely (handles undefined too)
	const sp = searchParams ? await Promise.resolve(searchParams) : {};
	const range = parseDashboardRange(sp);

	const session = (await cookies()).get("__Host-__Host-__Host-sb_auth")?.value;
	if (!session) redirect("/login");

	const { company } = await getUserCompanyContext(session);
	if (!company?.id) {
		return (
			<div className="px-6 py-10">
				<h1 className="text-xl font-semibold">Dashboard</h1>
				<p className="mt-2 text-slate-600">
					No company linked to your account yet.
				</p>
			</div>
		);
	}

	const kpis = await getDashboardKpis({
		range,
		companyId: company.id,
	});

	return (
		<div className="flex flex-col">
			<div className="flex flex-col gap-6 px-4 pb-8 pt-6 lg:px-8">
				<KpiStrip kpis={kpis} />
				<section>
					<DashboardCardsGrid />
				</section>
			</div>
		</div>
	);
}

function _renderIconSafe(icon: unknown): ReactNode {
	if (!icon) return null;
	if (typeof icon === "object") return icon as ReactNode;

	if (typeof icon === "function") {
		const Icon = icon as React.ComponentType<{ className?: string }>;
		return <Icon className="h-4 w-4 opacity-70" />;
	}

	if (typeof icon === "string") {
		return (
			<span className="rounded-md border px-2 py-1 text-xs opacity-70">
				{icon}
			</span>
		);
	}

	return null;
}
