export type DashboardKpiId =
  | "kpi-analytics"
  | "kpi-sales"
  | "kpi-marketing"
  | "kpi-downtime"
  | "kpi-crm"
  | "kpi-finance"
  | "kpi-social"
  | "kpi-booking";

export type DashboardKpiDefinition = {
  id: DashboardKpiId;
  title: string;
  subtitle: string;
  defaultEnabled: boolean;
};

export const DASHBOARD_KPI_DEFINITIONS: DashboardKpiDefinition[] = [
  {
    id: "kpi-analytics",
    title: "Analytics",
    subtitle: "Website traffic",
    defaultEnabled: true,
  },
  {
    id: "kpi-sales",
    title: "Sales",
    subtitle: "Revenue and orders",
    defaultEnabled: true,
  },
  {
    id: "kpi-marketing",
    title: "Marketing",
    subtitle: "Campaign performance",
    defaultEnabled: true,
  },
  {
    id: "kpi-downtime",
    title: "Downtime",
    subtitle: "Website availability",
    defaultEnabled: true,
  },
  {
    id: "kpi-crm",
    title: "CRM / Pipeline",
    subtitle: "Leads and opportunities",
    defaultEnabled: true,
  },
  {
    id: "kpi-finance",
    title: "Finance",
    subtitle: "Payments and financial activity",
    defaultEnabled: false,
  },
  {
    id: "kpi-social",
    title: "Social networks",
    subtitle: "Reach and engagement",
    defaultEnabled: false,
  },
  {
    id: "kpi-booking",
    title: "Booking",
    subtitle: "Reservations and appointments",
    defaultEnabled: false,
  },
];