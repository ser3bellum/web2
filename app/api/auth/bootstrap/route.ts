// app/api/auth/bootstrap/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebase/admin";
import { bootstrapUserAndWorkspace } from "@/lib/firebase/bootstrap";

export async function POST(req: Request) {
  try {
    const { idToken, name, companyName, companySize, country } = await req.json();

    if (!idToken) {
      return NextResponse.json({ ok: false, error: "Missing idToken" }, { status: 400 });
    }

    const decoded = await verifyIdToken(idToken);

    const result = await bootstrapUserAndWorkspace({
      uid: decoded.uid,
      email: decoded.email ?? null,
      name,
      companyName,
      companySize,
      country,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    console.error("BOOTSTRAP_ERROR:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Bootstrap failed" },
      { status: 500 }
    );
  }
}
