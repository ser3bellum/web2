export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("__Host-sb_auth")?.value ?? null;

  if (!session) {
    return NextResponse.json(
      { ok: false, hasCookie: false, error: "No __Host-sb_auth cookie on request" },
      { status: 401 }
    );
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);
    return NextResponse.json({
      ok: true,
      hasCookie: true,
      uid: decoded.uid,
      aud: (decoded as any).aud ?? null,
      iss: (decoded as any).iss ?? null,
      exp: decoded.exp ?? null,
      iat: decoded.iat ?? null,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        hasCookie: true,
        error: e?.message ?? "verifySessionCookie failed",
        code: e?.code ?? null,
        name: e?.name ?? null,
      },
      { status: 401 }
    );
  }
}