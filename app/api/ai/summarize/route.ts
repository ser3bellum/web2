import { NextResponse } from "next/server";
import { summarizeWithGemini } from "@/lib/ai/gemini";

export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json(
      { ok: false, error: "Request body must be a JSON object." },
      { status: 400 },
    );
  }

  const { text, maxBullets } = body as Record<string, unknown>;

  if (typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json(
      { ok: false, error: "`text` must be a non-empty string." },
      { status: 400 },
    );
  }

  if (maxBullets !== undefined) {
    if (
      typeof maxBullets !== "number" ||
      !Number.isInteger(maxBullets) ||
      maxBullets <= 0
    ) {
      return NextResponse.json(
        { ok: false, error: "`maxBullets` must be a positive integer." },
        { status: 400 },
      );
    }
  }

  const trimmedText = text.trim();

  try {
    const data = await summarizeWithGemini({
      text: trimmedText,
      maxBullets,
    });

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("[api/ai/summarize]", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Internal server error.",
      },
      { status: 500 },
    );
  }
}