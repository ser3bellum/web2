// app/(auth)/layout.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionCookie } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies(); // ✅ Next 16.1.6 = async
  const session = cookieStore.get("sb_auth")?.value;

  if (session) {
    try {
      await verifySessionCookie(session);
      redirect("/dashboard");
    } catch {
      // invalid cookie -> allow login/register
    }
  }

  return <>{children}</>;
}
