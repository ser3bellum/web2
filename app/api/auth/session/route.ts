import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();

    const expiresIn = 7 * 24 * 60 * 60 * 1000; // 7 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const res = NextResponse.json({ ok: true });

    res.cookies.set("sb_auth", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",                 // ✅ THIS is the key fix
      maxAge: expiresIn / 1000,  // seconds
    });

    return res;
  } catch (err) {
    console.error("SESSION COOKIE ERROR", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
