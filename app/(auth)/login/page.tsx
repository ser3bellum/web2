import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase/admin";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("sb_auth")?.value;

  if (session) {
    try {
      await adminAuth.verifySessionCookie(session, true);
      redirect("/dashboard");
    } catch {
      // invalid cookie -> show login form
    }
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="mb-10 flex items-center justify-center">
        <img
          src="/brand/ser3bellum-logo-final.svg"
          alt="Ser3bellum"
          className="h-12 w-auto"
        />
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm">
        <LoginForm />
      </div>
    </main>
  );
}
