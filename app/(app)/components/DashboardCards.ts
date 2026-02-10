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
  | "productivity";

export type DashboardCardDef = {
  id: DashboardCardId;
  title: string;
  subtitle?: string;
  defaultEnabled: boolean;
  size?: "small" | "medium" | "large";
};

export const DASHBOARD_CARDS: DashboardCardDef[] = [
  {
    id: "analytics",
    title: "Analytics",
    subtitle: "Website traffic for the selected period",
    defaultEnabled: true,
    size: "large",
  },
  {
    id: "sales",
    title: "Sales",
    subtitle: "Sales overview for the selected period",
    defaultEnabled: true,
    size: "large",
  },
  {
    id: "marketing",
    title: "Marketing",
    subtitle: "Conversions by channel",
    defaultEnabled: true,
    size: "large",
  },

  {
    id: "downtime",
    title: "Downtime",
    subtitle: "Downtime events for the selected period",
    defaultEnabled: true,
    size: "medium",
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
  },

  {
    id: "accounting",
    title: "Accounting",
    subtitle: "Invoices, payments, reconciliation",
    defaultEnabled: true,
    size: "medium",
  },
  {
    id: "social",
    title: "Social networks",
    subtitle: "Instagram, Facebook, engagement signals",
    defaultEnabled: true,
    size: "medium",
  },
  {
    id: "booking",
    title: "Booking",
    subtitle: "Reservations & PMS integrations (e.g. Mews)",
    defaultEnabled: true,
    size: "medium",
  },
  {
    id: "productivity",
    title: "Productivity",
    subtitle: "Tasks, comms, workflows",
    defaultEnabled: true,
    size: "medium",
  },
];
