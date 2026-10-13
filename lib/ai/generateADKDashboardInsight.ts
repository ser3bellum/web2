
import "server-only";

import type { AIInsightPayload } from "@/types/ai";
import type { DashboardInsightInput } from "@/lib/ai/generateDashboardInsight";
import { runBusinessInsightsAgent } from "@/lib/ai/adk/runBusinessInsightsAgent";

function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return text.slice(start, end + 1);
}

function isAIInsightPayload(value: unknown): value is AIInsightPayload {
  if (!value || typeof value !== "object") return false;

  const v = value as Record<string, unknown>;

  const validStatus =
    v.status === "ready" || v.status === "empty";

  const validSeverity =
    v.severity === "low" ||
    v.severity === "medium" ||
    v.severity === "high";

  return (
    validStatus &&
    typeof v.headline === "string" &&
    typeof v.whyItMatters === "string" &&
    typeof v.recommendedAction === "string" &&
    typeof v.sourceNote === "string" &&
    validSeverity
  );
}

export async function generateADKDashboardInsight(
  input: DashboardInsightInput
): Promise<AIInsightPayload> {
  const rawText = await runBusinessInsightsAgent(input);

  const jsonText = extractJsonObject(rawText);

  if (!jsonText) {
    throw new Error("ADK response did not contain a JSON object.");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("ADK returned invalid JSON.");
  }

  if (!isAIInsightPayload(parsed)) {
    throw new Error(
      "ADK returned JSON with an invalid AIInsightPayload shape."
    );
  }

  return {
    ...parsed,
    generatedAt: new Date().toISOString(),
  };
}
