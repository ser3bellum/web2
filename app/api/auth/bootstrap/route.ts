import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { bootstrapUserAndWorkspace } from "@/lib/firebase/bootstrap";

export async function POST(req: Request) {
  try {
    const { idToken, name, companyName, companySize, country } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;
    const email = decoded.email ?? null;

    const result = await bootstrapUserAndWorkspace({
      uid,
      email,
      name: name ?? null,
      companyName: companyName ?? null,
      companySize: companySize ?? null,
      country: country ?? null,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("BOOTSTRAP ERROR", err);
    return NextResponse.json({ error: "Failed to bootstrap user" }, { status: 500 });
  }
}
