// app/dashboard/dashboardKpis.ts
import type { DashboardRange } from "@/app/(app)/lib/dateRange";

export async function getDashboardKpis(params: {
	companyId: string;
	range: DashboardRange;
}): Promise<DashboardKpi[]> {
	const { companyId: _companyId, range: _range } = params;

	// TODO: use companyId + range.from/range.to
	return DASHBOARD_KPIS;
}

export type DashboardKpi = {
	id: string;
	title: string;
	value: string;
	subtitle?: string;
	delta?: {
		value: string;
		tone?: "up" | "down" | "neutral";
	};
};

export const DASHBOARD_KPIS: DashboardKpi[] = [
	{
		id: "kpi-analytics",
		title: "Analytics",
		value: "12.4k",
		subtitle: "Visitors",
		delta: { value: "+8.2%", tone: "up" },
	},
	{
		id: "kpi-sales",
		title: "Sales",
		value: "£4,280",
		subtitle: "This month",
		delta: { value: "+5.4%", tone: "up" },
	},
	{
		id: "kpi-marketing",
		title: "Marketing",
		value: "1.8k",
		subtitle: "Campaign visits",
		delta: { value: "+12.3%", tone: "up" },
	},
	{
		id: "kpi-downtime",
		title: "Downtime",
		value: "12 min",
		subtitle: "Last 30 days",
		delta: { value: "-35%", tone: "up" },
	},
	{
		id: "kpi-cpu-usage",
		title: "CPU Usage",
		value: "68%",
		subtitle: "Current average",
		delta: { value: "-4%", tone: "up" },
	},
];
