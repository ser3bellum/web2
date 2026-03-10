export type DashboardRange = { from: string; to: string };

export type DashboardCard = {
  key: "uptime" | "ga_overview" | "incidents" | "integrations";
  title: string;
  status: "ok" | "warn" | "error" | "disabled";
  value: string;
  delta?: string;
  meta?: Record<string, any>;
};

export type DashboardResponse = {
  range: DashboardRange;
  cards: DashboardCard[];
  integrations: Array<{
    key: string;                 // "google"
    providerConfigKey: string;   // "google-analytics"
    connected: boolean;
    connectionId?: string;
  }>;
};