// app/api/auth/session/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import {
  adminDb,
  createSessionCookie,
  verifyIdToken,
} from "@/lib/firebase/admin";

/* -------------------------------- helpers -------------------------------- */

const SUPPORTED_LANGUAGES = ["en", "fr"] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

function cleanString(v: unknown) {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s.length ? s : undefined;
}

function cleanLanguage(v: unknown): SupportedLanguage | undefined {
  if (typeof v !== "string") return undefined;
  return SUPPORTED_LANGUAGES.includes(v as SupportedLanguage)
    ? (v as SupportedLanguage)
    : undefined;
}

async function safeJson(req: Request) {
  const ct = req.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    return {
      ok: false as const,
      status: 415 as const,
      error: "Expected application/json",
      body: null,
    };
  }

  try {
    const body = await req.json();
    return { ok: true as const, status: 200 as const, body, error: null };
  } catch {
    return {
      ok: false as const,
      status: 400 as const,
      error: "Invalid JSON body",
      body: null,
    };
  }
}

/* -------------------------------- handler -------------------------------- */

export async function POST(req: Request) {
  const parsed = await safeJson(req);
  if (!parsed.ok) {
    return NextResponse.json(
      { ok: false, error: parsed.error },
      { status: parsed.status },
    );
  }

  const { idToken, profile } = parsed.body ?? {};
  const token = typeof idToken === "string" ? idToken.trim() : "";

  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Missing idToken" },
      { status: 400 },
    );
  }

  try {
    const decoded = await verifyIdToken(token);
    const uid = decoded.uid;
    const email = decoded.email ?? null;
    const tokenName = decoded.name ?? null;

    const userRef = adminDb.collection("users").doc(uid);
    const snap = await userRef.get();
    const isNewUser = !snap.exists;
    const existingUser = snap.exists ? (snap.data() as Record<string, any>) : null;

    const baseUpdate: Record<string, any> = {
      email,
      lastLoginAt: FieldValue.serverTimestamp(),
    };

    if (isNewUser) {
      baseUpdate.createdAt = FieldValue.serverTimestamp();
      baseUpdate.onboardingStatus = "registered";
    }

    const update: Record<string, any> = {};

    if (profile && typeof profile === "object") {
      const p = profile as Record<string, unknown>;

      const name = cleanString(p.name) ?? cleanString(tokenName);
      if (name) update.name = name;

      const companyName = cleanString(p.companyName);
      if (companyName) update.companyName = companyName;

      const companySize = cleanString(p.companySize);
      if (companySize) update.companySize = companySize;

      const industry = cleanString(p.industry);
      if (industry) update.industry = industry;

      const country = cleanString(p.country);
      if (country) update.country = country;

      const initialLanguage = cleanLanguage(p.initialLanguage);
      if (initialLanguage) {
        update.initialLanguage = initialLanguage;
      }

      if (!existingUser?.companyId && companyName) {
        const companyRef = adminDb.collection("companies").doc();
        await companyRef.set({
          name: companyName,
          ownerUid: uid,
          createdAt: FieldValue.serverTimestamp(),
        });
        update.companyId = companyRef.id;
      }
    } else {
      const fallbackName = cleanString(tokenName);
      if (fallbackName) {
        update.name = fallbackName;
      }
    }

    await userRef.set({ ...baseUpdate, ...update }, { merge: true });

    const expiresIn = 14 * 24 * 60 * 60 * 1000;
    const sessionCookie = await createSessionCookie(token, expiresIn);

    const res = NextResponse.json({ ok: true });

    res.cookies.set("__Host-sb_auth", sessionCookie, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(expiresIn / 1000),
    });

    return res;
  } catch (err: any) {
    console.error("SESSION_ERROR:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err?.message ?? "Failed to create session",
      },
      { status: 500 },
    );
  }
}
