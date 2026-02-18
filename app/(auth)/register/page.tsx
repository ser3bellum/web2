// app/(auth)/register/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import RegisterClient from "./RegisterClient";
import { verifySessionCookie } from "@/lib/firebase/admin";

export default async function RegisterPage() {
  const cookieStore = await cookies(); // ✅ in your Next version, this is correct
  const session = cookieStore.get("sb_auth")?.value;

  if (session) {
    try {
      await verifySessionCookie(session);
      redirect("/dashboard");
    } catch {
      // invalid/expired cookie → show register UI
    }
  }

  return <RegisterClient />;
}
