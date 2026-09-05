export type DashboardHydrationStatus =
  | "ok"
  | "warn"
  | "error"
  | "disabled";

export type DashboardHydrationCard = {
  key: string;
  title: string;
  status: DashboardHydrationStatus;
  value: string;
  delta?: string;
  meta?: Record<string, any>;
};

export type DashboardIntegration = {
  key: string;
  providerConfigKey: string;
  connected: boolean;
  connectionId?: string;
};

export type DashboardHydration = {
  range: {
    from: string;
    to: string;
  };
  integrations: DashboardIntegration[];
  cards: DashboardHydrationCard[];
};

export type DashboardKpi = {
  id: string;
  title: string;
  value: string;
  subtitle?: string;
  delta?: {
    value: string;
    tone?: "up" | "down" | "neutral";
  };
  meta?: Record<string, any>;
};