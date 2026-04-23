export type AIInsightStatus = "loading" | "ready" | "empty" | "error";

export type AIInsightSeverity = "low" | "medium" | "high";

export type AIInsightPayload = {
  status: AIInsightStatus;
  headline: string;
  whyItMatters: string;
  recommendedAction: string;
  sourceNote: string;
  severity?: AIInsightSeverity;
  generatedAt?: string;
};