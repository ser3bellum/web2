// app/(app)/components/DashboardCards.ts

export type DashboardCardId =
  | "analytics"
  | "sales"
  | "marketing"
  | "downtime"
  | "crm"
  | "finance"
  | "social"
  | "booking"
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
    sources: [
      { label: "Shopify" },
      { label: "WooCommerce" },
    ],
  },

  {
    id: "marketing",
    title: "Marketing",
    subtitle: "Campaigns and conversions by channel",
    defaultEnabled: true,
    size: "medium",
    sources: [
      { label: "Google Ads" },
      { label: "Meta Ads", variant: "warning" },
      { label: "Brevo" },
    ],
  },

  {
    id: "downtime",
    title: "Downtime",
    subtitle: "Website availability and incidents",
    defaultEnabled: true,
    size: "medium",
    sources: [{ label: "Cloudflare" }],
  },

  {
    id: "crm",
    title: "CRM / Pipeline",
    subtitle: "Leads, opportunities and pipeline activity",
    defaultEnabled: true,
    size: "medium",
    sources: [
      { label: "HubSpot" },
      { label: "Salesforce" },
    ],
  },

  {
    id: "finance",
    title: "Finance",
    subtitle: "Payments, invoices and financial activity",
    defaultEnabled: true,
    size: "medium",
    sources: [
      { label: "Stripe" },
      { label: "QuickBooks" },
      { label: "Sage" },
    ],
  },

  {
    id: "social",
    title: "Social networks",
    subtitle: "Social reach and engagement signals",
    defaultEnabled: true,
    size: "medium",
    sources: [
      { label: "Instagram" },
      { label: "Facebook" },
    ],
  },

  {
    id: "booking",
    title: "Booking",
    subtitle: "Appointments and reservations",
    defaultEnabled: true,
    size: "medium",
    sources: [
      { label: "Calendly" },
      { label: "Google Calendar" },
    ],
  },
];