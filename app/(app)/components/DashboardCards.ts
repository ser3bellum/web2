// app/components/dashboardCards.ts
export type DashboardCardId =
  | "analytics"
  | "sales"
  | "marketing"
  | "uptime"
  | "cpu"
  | "downtime"
  | "threats"
  | "apiKey"
  | "trackUrl";

export type DashboardCardDef = {
  id: DashboardCardId;
  title: string;
  subtitle?: string;
  defaultEnabled: boolean;
  // Optional grouping / sizing hints
  size?: "small" | "medium" | "large";
};

export const DASHBOARD_CARDS: DashboardCardDef[] = [
  { id: "analytics", title: "Analytics", subtitle: "Website traffic for the selected period", defaultEnabled: true, size: "large" },
  { id: "sales", title: "Sales", subtitle: "Sales overview for the selected period", defaultEnabled: true, size: "large" },
  { id: "marketing", title: "Marketing", subtitle: "Conversions by channel", defaultEnabled: true, size: "large" },

  { id: "uptime", title: "Uptime", subtitle: "Performance for the selected period", defaultEnabled: true, size: "medium" },
  { id: "cpu", title: "CPU Usage", subtitle: "Real-time CPU load", defaultEnabled: true, size: "medium" },
  { id: "downtime", title: "Downtime", subtitle: "Downtime events for the selected period", defaultEnabled: true, size: "medium" },

  { id: "threats", title: "Threats", subtitle: "Blocked attempts and incidents", defaultEnabled: true, size: "medium" },
  { id: "apiKey", title: "API Key", subtitle: "Manage API keys", defaultEnabled: true, size: "medium" },
  { id: "trackUrl", title: "Track new URL", subtitle: "Add monitoring for a new URL", defaultEnabled: true, size: "medium" },
];
