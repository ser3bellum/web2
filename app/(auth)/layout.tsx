import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies(); // ✅ this is the fix
  const session = cookieStore.get("sb_auth")?.value;

  if (session) {
    try {
      await adminAuth.verifySessionCookie(session, true);
      redirect("/dashboard");
    } catch {
      // invalid cookie -> allow login/register
    }
  }

  return <>{children}</>;
}
