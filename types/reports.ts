export type DailyActivityMetric = {
  label: string;
  value: number;
  displayValue: string;
};

export type DailyHealthMetric = {
  label: string;
  value: number;
  max: number;
  displayValue: string;
  tone: "good" | "warning" | "critical" | "neutral";
};

export type DailyReport = {
  date: string;
  headline: string;
  summary: string;
  summaryLabel: "AI summary" | "Operational summary";
  bullets: string[];
  activity: DailyActivityMetric[];
  health: DailyHealthMetric[];
  reportId: string;
};