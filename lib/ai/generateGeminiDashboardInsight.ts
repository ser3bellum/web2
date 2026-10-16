import { GoogleGenAI } from "@google/genai";
import type { AIInsightPayload } from "@/types/ai";
import type { DashboardInsightInput } from "@/lib/ai/generateDashboardInsight";

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
    v.status === "loading" ||
    v.status === "ready" ||
    v.status === "empty" ||
    v.status === "error";

  const validSeverity =
    v.severity === undefined ||
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

export async function generateGeminiDashboardInsight(
  input: DashboardInsightInput
): Promise<AIInsightPayload> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });

 const prompt = `
You are Ser3bellum's operational intelligence assistant.

Your task is to identify ONE useful, evidence-based business
observation from the provided dashboard data.

Ser3bellum organizes information into business categories:
Analytics, Sales, Marketing, Downtime, CRM/Pipeline,
Finance, Social Media, and Booking.

IMPORTANT DATA ARCHITECTURE:
- Business categories are NOT individual integrations.
- One category may contain evidence from multiple providers.
- One provider may contribute evidence to multiple categories.
- businessSources contains provider-specific evidence.
- signals contains simplified category-level values.
- When both are available, use businessSources to establish
  provenance and clarify the meaning of metrics.
- Do not assume a flattened signal represents every provider
  within its category.

SOURCE INTERPRETATION:
- Always distinguish providers and their metric definitions.
- Never automatically add revenue from Shopify and Stripe.
  They may represent overlapping transactions.
- Do not treat Stripe gross payments as identical to Shopify
  order revenue.
- Do not treat Stripe account balances as period revenue.
- Do not treat users, sessions, and page views as interchangeable.
- Never combine different currencies without explicit conversion
  information.
- Do not compare figures covering different reporting periods
  as though they were directly comparable.
- A provider with status "warn" may be connected but still
  awaiting usable metrics.
- A provider with status "disabled" must not be assumed
  to have reported zero activity.
- Do not infer connection health solely from metric values.

DATA RELIABILITY:
- Use ONLY the supplied dashboard input.
- Never invent values, trends, causes, or missing metrics.
- Zero is a valid observed value when explicitly reported.
- Null, absent, or unavailable metrics are NOT zero.
- An empty metrics object contains no performance evidence.
- If a provider has no usable metrics, do not make performance
  claims about that provider.
- Treat category-level signals without explicit provenance
  cautiously.
- Do not claim that business activity is stable unless
  comparative evidence supports that conclusion.

INSIGHT SELECTION:
- Identify the most meaningful operational observation
  supported by the available evidence.
- Prefer a specific, actionable finding over a generic summary.
- You may compare metrics across providers only when their
  meanings, time periods, and units make the comparison valid.
- Distinguish an observed fact from a possible explanation.
- Never present a hypothesis as a confirmed cause.
- If evidence supports only a limited observation, say so.
- Do not return "empty" merely because observed activity
  is low, zero, or unchanged.
- Return "empty" when insufficient usable evidence exists
  to make a responsible operational observation.

OUTPUT:
Return exactly ONE valid JSON object and nothing else.

Required JSON fields:
- status
- headline
- whyItMatters
- recommendedAction
- sourceNote
- severity

Rules:
- status must be "ready" or "empty".
- severity must be "low", "medium", or "high".
- Keep the insight concise and operational.
- recommendedAction must be concrete and proportional
  to the available evidence.
- sourceNote must identify the provider and metrics used.
- Do not mention a provider as evidence unless it supplied
  the relevant metric.
- Do not invent sources or cite metrics absent from the input.

If status is "empty", return:
{
  "status": "empty",
  "headline": "",
  "whyItMatters": "",
  "recommendedAction": "",
  "sourceNote": "",
  "severity": "low"
}

Dashboard input:
${JSON.stringify(input, null, 2)}
`.trim();

const model =
  process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";

const response = await ai.models.generateContent({
  model,
  contents: prompt,
});

  const rawText = response.text ?? "";
  const jsonText = extractJsonObject(rawText);

  if (!jsonText) {
    throw new Error("Gemini response did not contain a JSON object.");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("Gemini returned invalid JSON.");
  }

  if (!isAIInsightPayload(parsed)) {
    throw new Error("Gemini returned JSON with an invalid AIInsightPayload shape.");
  }

  return {
    ...parsed,
    generatedAt: new Date().toISOString(),
  };
}
