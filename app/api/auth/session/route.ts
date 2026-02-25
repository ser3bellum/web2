// app/api/auth/session/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, createSessionCookie, verifyIdToken } from "@/lib/firebase/admin";

function cleanString(v: unknown) {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s.length ? s : undefined;
}

async function readJson(req: Request) {
  // Prefer JSON, but tolerate missing/wrong content-type
  try {
    return await req.json();
  } catch {
    const text = await req.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
}

export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { idToken, profile } = body ?? {};
  const token = typeof idToken === "string" ? idToken.trim() : "";

  if (!token) {
    return NextResponse.json({ ok: false, error: "Missing idToken" }, { status: 400 });
  }

  try {
    // 1) Verify token
    const decoded = await verifyIdToken(token);
    const uid = decoded.uid;
    const email = decoded.email ?? null;
    const tokenName = decoded.name ?? null;

    // 2) Create session cookie first
    const expiresIn = 14 * 24 * 60 * 60 * 1000; // 14 days
    const sessionCookie = await createSessionCookie(token, expiresIn);

    // 3) Build response and SET COOKIE on this exact response
    const res = NextResponse.json({ ok: true });
    res.headers.set("Cache-Control", "no-store");

    res.cookies.set("__Host-sb_auth", sessionCookie, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(expiresIn / 1000),
    });

    // 4) Firestore updates are best-effort; never break login
    try {
      const userRef = adminDb.collection("users").doc(uid);

      const userSnap = await userRef.get();
      const isNewUser = !userSnap.exists;

      const existingUser = userSnap.exists ? (userSnap.data() as any) : null;
      const existingCompanyId: string | undefined = existingUser?.companyId;

      const baseUpdate: Record<string, any> = {
        email,
        lastLoginAt: FieldValue.serverTimestamp(),
      };

      if (isNewUser) {
        baseUpdate.createdAt = FieldValue.serverTimestamp();
        baseUpdate.onboardingStatus = "registered";
      }

      const hasProfile = profile && typeof profile === "object";

      if (hasProfile) {
        const p = profile as Record<string, unknown>;
        const profileUpdate: Record<string, any> = {};

        const name = cleanString(p.name) ?? cleanString(tokenName);
        if (name) profileUpdate.name = name;

        const companyName = cleanString(p.companyName);
        if (companyName) profileUpdate.companyName = companyName;

        const companySize = cleanString(p.companySize);
        if (companySize) profileUpdate.companySize = companySize;

        const country = cleanString(p.country);
        if (country) profileUpdate.country = country;

        // Create + link company if missing companyId and companyName exists
        if (!existingCompanyId && companyName) {
          const companyRef = adminDb.collection("companies").doc();
          await companyRef.set(
            {
              name: companyName,
              ownerUid: uid,
              createdAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
          profileUpdate.companyId = companyRef.id;
        }

        await userRef.set({ ...baseUpdate, ...profileUpdate }, { merge: true });
      } else {
        await userRef.set(baseUpdate, { merge: true });
      }
    } catch (e) {
      console.error("SESSION_PROFILE_WRITE_FAILED:", e);
    }

    return res;
  } catch (err: any) {
    console.error("SESSION_ERROR:", err?.message, err?.stack, err);
    return NextResponse.json(
      {
        ok: false,
        error: err?.message ?? "Failed to create session",
        code: err?.code ?? null,
        name: err?.name ?? null,
      },
      { status: 500 }
    );
  }
}
