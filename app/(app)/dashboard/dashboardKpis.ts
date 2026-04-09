import type { DashboardRange } from "@/app/(app)/lib/dateRange";
import type { DashboardHydration } from "./getDashboardHydration";

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

function toneFromDelta(delta?: string): "up" | "down" | "neutral" {
	if (!delta) return "neutral";
	if (delta.startsWith("-")) return "down";
	if (delta.startsWith("+")) return "up";
	return "neutral";
}

export async function getDashboardKpis(params: {
	companyId: string;
	range: DashboardRange;
	hydration?: DashboardHydration | null;
}): Promise<DashboardKpi[]> {
	const { hydration } = params;

	const gaOverview = hydration?.cards?.find((card) => card.key === "ga_overview");

	const analyticsValue =
		gaOverview?.status === "ok"
			? gaOverview.value.replace(/\s+sessions?$/i, "")
			: "—";

	const analyticsDelta = gaOverview?.delta;

	return [
		{
			id: "kpi-analytics",
			title: "Analytics",
			value: analyticsValue,
			subtitle: "Visitors",
			delta: analyticsDelta
				? {
						value: analyticsDelta,
						tone: toneFromDelta(analyticsDelta),
				  }
				: undefined,
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
}
