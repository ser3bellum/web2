// app/dashboard/dashboardKpis.ts
import type { DashboardRange } from "@/lib/dateRange"; // adjust relative path

export async function getDashboardKpis(
  range: DashboardRange
): Promise<DashboardKpi[]> {
  // TODO: later use range.from / range.to
  return DASHBOARD_KPIS;
}

export type DashboardKpi = {
  id: string;
  title: string;
  value: string;
  subtitle?: string;
  delta?: {
    value: string; // e.g. "+2.4%" or "-1.1%"
    tone?: "up" | "down" | "neutral";
  };
};

export const DASHBOARD_KPIS: DashboardKpi[] = [
  {
    id: "kpi-uptime",
    title: "Uptime",
    value: "99.94%",
    subtitle: "Last 7 days",
    delta: { value: "+0.12%", tone: "up" },
  },
  {
    id: "kpi-incidents",
    title: "Incidents",
    value: "2",
    subtitle: "Open",
    delta: { value: "-1", tone: "up" },
  },
  {
    id: "kpi-latency",
    title: "Latency",
    value: "312ms",
    subtitle: "P95",
    delta: { value: "-18ms", tone: "up" },
  },
  {
    id: "kpi-errors",
    title: "Errors",
    value: "0.7%",
    subtitle: "Rate",
    delta: { value: "-0.2%", tone: "up" },
  },
  {
    id: "kpi-alerts",
    title: "Alerts",
    value: "14",
    subtitle: "Last 24h",
    delta: { value: "+3", tone: "down" },
  },
];

