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
You are generating one operational insight for a SaaS dashboard.

Use only the provided dashboard input.
Do not invent missing values.
Return exactly one valid JSON object and nothing else.

Required JSON fields:
- status
- headline
- whyItMatters
- recommendedAction
- sourceNote
- severity

Rules:
- status must be one of: "ready", "empty", "error"
- severity must be one of: "low", "medium", "high"
- Keep the insight concise and operational.
- recommendedAction must be concrete.
- sourceNote must mention the signals used.
- Zero is a valid observed value. Do not treat a value of 0 as missing data.
- Null or absent values mean the signal is unavailable.
- If usable signals are present, evaluate them and return "ready"
  when they support a meaningful operational observation.
- Do not return "empty" merely because activity is low, zero,
  stable, or unchanged.
- Return "empty" only when the provided input contains insufficient
  usable signals to make a responsible operational observation.
- Never infer that a connector is disconnected unless the input
  explicitly provides connector status information.

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
