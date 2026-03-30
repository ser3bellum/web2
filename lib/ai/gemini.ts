import "server-only";

// lib/ai/gemini.ts
// Reusable server-side Gemini summarization utility.

export interface SummarizeInput {
  text: string;
  maxBullets?: number;
}

export interface SummarizeResult {
  summary: string;
  bullets: string[];
  model: string;
}

function getEnv(key: string): string | undefined {
  return process.env[key]?.trim() || undefined;
}

export function getModel(): string {
  return getEnv("GEMINI_MODEL") ?? "gemini-2.0-flash";
}

export function hasApiKey(): boolean {
  return getEnv("GEMINI_API_KEY") !== undefined;
}

function mockSummarize(input: SummarizeInput): SummarizeResult {
  const maxBullets = input.maxBullets ?? 3;
  const words = input.text.split(/\s+/).filter(Boolean);
  const preview = words.slice(0, 30).join(" ");

  return {
    summary: `[MOCK] ${preview}${words.length > 30 ? "…" : ""}`,
    bullets: Array.from({ length: Math.min(maxBullets, 3) }, (_, i) => `Mock bullet ${i + 1}`),
    model: "mock",
  };
}

export async function summarizeWithGemini(
  input: SummarizeInput,
): Promise<SummarizeResult> {
  if (!input.text || input.text.trim().length === 0) {
    throw new Error("summarizeWithGemini: `text` must be a non-empty string.");
  }

  const apiKey = getEnv("GEMINI_API_KEY");

  if (!apiKey) {
    console.warn("[gemini] GEMINI_API_KEY is not set – returning mocked result.");
    return mockSummarize(input);
  }

  const model = getModel();
  const maxBullets = input.maxBullets ?? 5;

  const prompt = [
    "Summarize the following text.",
    `Return JSON with exactly two keys: "summary" (string) and "bullets" (array of up to ${maxBullets} strings).`,
    "Do not include anything outside the JSON object.",
    "",
    "---",
    input.text,
  ].join("\n");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${body.slice(0, 300)}`);
  }

  const json = await res.json();
  const raw: string | undefined =
    json?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!raw) {
    throw new Error("Gemini returned an empty or malformed response.");
  }

  let parsed: { summary?: string; bullets?: unknown[] };

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Gemini returned invalid JSON.");
  }

  return {
    summary: (parsed.summary ?? "").trim(),
    bullets: Array.isArray(parsed.bullets)
      ? parsed.bullets.map((b) => String(b).trim()).filter(Boolean).slice(0, maxBullets)
      : [],
    model,
  };
}