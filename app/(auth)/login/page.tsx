"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();

  useEffect(() => {
    // If already "logged in", skip login screen
    const hasAuthCookie =
      typeof document !== "undefined" &&
      document.cookie.split("; ").some((c) => c.startsWith("sb_auth=1"));

    if (hasAuthCookie) router.replace("/dashboard");
  }, [router]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Fake auth cookie (7 days)
    document.cookie = [
      "sb_auth=1",
      "Path=/",
      "Max-Age=604800", // 7 days
      "SameSite=Lax",
    ].join("; ");

    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-10 flex items-center justify-center">
        <img
          src="/brand/ser3bellum-logo-final.svg"
          alt="Ser3bellum"
          className="h-12 w-auto"
        />
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Login</h1>

        <p className="mt-1 text-sm text-slate-500">
          Enter your credentials to continue
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@company.com"
              className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Forgot password */}
          <div className="-mt-2 flex justify-end">
            <button
              type="button"
              className="text-sm text-blue-600 hover:underline"
              onClick={() => alert("Forgot password (later)")}
            >
              Forgot password?
            </button>
          </div>

          {/* CTA */}
          <button
            type="submit"
            className="mt-2 h-11 w-full rounded-lg bg-blue-600 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            Continue
          </button>
        </form>
      </div>
    </main>
  );
}
