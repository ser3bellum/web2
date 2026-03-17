import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";
import { getUserCompanyContext } from "@/lib/data/getUserCompanyContext";

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("__Host-sb_auth")?.value;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await adminAuth.verifySessionCookie(session, true);
  } catch (e) {
    console.error("AUTH_ME_SESSION_REJECTED:", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = await getUserCompanyContext(session);

  if (!user?.id) {
    return NextResponse.json({ error: "Missing user id" }, { status: 401 });
  }

  return NextResponse.json({
    endUserId: user.id,
    email: user.email ?? null,
  });
}