// app/api/auth/session/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, createSessionCookie, verifyIdToken } from "@/lib/firebase/admin";

function cleanString(v: unknown) {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s.length ? s : undefined;
}



async function safeJson(req: Request) {
  const ct = req.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    return { ok: false as const, status: 415 as const, body: null, error: "Expected application/json" };
  }
  try {
    const body = await req.json();
    return { ok: true as const, status: 200 as const, body, error: null };
  } catch {
    return { ok: false as const, status: 400 as const, body: null, error: "Invalid JSON body" };
  }
}

export async function POST(req: Request) {
  // 1) Kill bot noise & bad requests up front (no more 500s from crawlers)


  const parsed = await safeJson(req);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: parsed.status });
  }

  const { idToken, profile } = parsed.body ?? {};
  const token = typeof idToken === "string" ? idToken.trim() : "";

  if (!token) {
    return NextResponse.json({ ok: false, error: "Missing idToken" }, { status: 400 });
  }

  try {
    // 2) Verify token (auth correctness)
    const decoded = await verifyIdToken(token);
    const uid = decoded.uid;
    const email = decoded.email ?? null;
    const tokenName = decoded.name ?? null;

    // 3) Create session cookie FIRST (so login works even if Firestore write fails)
    const expiresIn = 14 * 24 * 60 * 60 * 1000; // 14 days
    const sessionCookie = await createSessionCookie(token, expiresIn);

    const res = NextResponse.json({ ok: true });

    // Force secure on hosted.app / Cloud Run (HTTPS). Don't rely on NODE_ENV.
    res.cookies.set("__Host-sb_auth", sessionCookie, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(expiresIn / 1000),
    });

    // 4) Firestore updates are BEST EFFORT — do not break login if they fail
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
      // still return ok:true with cookie already set
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
