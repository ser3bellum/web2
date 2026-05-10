// app/(app)/components/DashboardCards.ts

export type DashboardCardId =
	| "analytics"
	| "sales"
	| "marketing"
	| "downtime"
	| "cpu"
	| "threats"
	| "accounting"
	| "social"
	| "booking"
	| "productivity"
	| "aiInsights";

export type DashboardCardSource = {
	label: string;
	variant?: "default" | "success" | "warning" | "danger";
};

export type DashboardCardDef = {
	id: DashboardCardId;
	title: string;
	subtitle?: string;
	defaultEnabled: boolean;
	size?: "small" | "medium" | "large" | "extraLarge";
	sources?: DashboardCardSource[];
};

export const DASHBOARD_CARDS: DashboardCardDef[] = [
	{
		id: "analytics",
		title: "Analytics",
		subtitle: "Website traffic for the selected period",
		defaultEnabled: true,
		size: "medium",
		sources: [{ label: "Google Analytics" }],
	},
	{
		id: "aiInsights",
		title: "AI Insights",
		subtitle: "Smart operational summary",
		defaultEnabled: true,
		size: "large",
		sources: [{ label: "Ser3bellum AI" }],
	},
	{
		id: "sales",
		title: "Sales",
		subtitle: "Sales overview for the selected period",
		defaultEnabled: true,
		size: "medium",
		sources: [{ label: "Shopify" }, { label: "Stripe" }],
	},
	{
		id: "marketing",
		title: "Marketing",
		subtitle: "Conversions by channel",
		defaultEnabled: true,
		size: "medium",
		sources: [{ label: "Meta Marketing API", variant: "warning" }],
	},
	{
		id: "downtime",
		title: "Downtime",
		subtitle: "Downtime events for the selected period",
		defaultEnabled: true,
		size: "medium",
		sources: [{ label: "UptimeRobot" }],
	},
	{
		id: "cpu",
		title: "CPU Usage",
		subtitle: "System load over time",
		defaultEnabled: true,
		size: "medium",
	},
	{
		id: "threats",
		title: "Threats",
		subtitle: "Blocked attempts and incidents",
		defaultEnabled: true,
		size: "medium",
		sources: [{ label: "Cloudflare" }],
	},
	{
		id: "accounting",
		title: "Accounting",
		subtitle: "Invoices, payments, reconciliation",
		defaultEnabled: true,
		size: "medium",
		sources: [{ label: "QuickBooks" }, { label: "Xero" }],
	},
	{
		id: "social",
		title: "Social networks",
		subtitle: "Instagram, Facebook, engagement signals",
		defaultEnabled: true,
		size: "medium",
		sources: [{ label: "Instagram" }, { label: "Facebook" }],
	},
	{
		id: "booking",
		title: "Booking",
		subtitle: "Reservations & PMS integrations (e.g. Mews)",
		defaultEnabled: true,
		size: "medium",
		sources: [{ label: "Mews" }],
	},
	{
		id: "productivity",
		title: "Productivity",
		subtitle: "Tasks, comms, workflows",
		defaultEnabled: true,
		size: "medium",
		sources: [{ label: "Slack" }, { label: "Google Workspace" }],
	},
];