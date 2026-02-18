"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase/clients";

const COMPANY_SIZES = ["1–10", "11–50", "51–200", "201–500", "501–1000", "1000+"];

const COUNTRIES = [
  "France",
  "United Kingdom",
  "United States",
  "Germany",
  "Spain",
  "Italy",
  "Canada",
  "Australia",
];

export default function RegisterClient() {
  const router = useRouter();

  const [signup, setSignup] = useState({
    name: "",
    email: "",
    password: "",
    companyName: "",
    companySize: "",
    country: "",
  });

  const [login, setLogin] = useState({
    email: "",
    password: "",
  });

  const [loadingSignup, setLoadingSignup] = useState(false);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSignupSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoadingSignup(true);

    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        signup.email,
        signup.password
      );

      const idToken = await cred.user.getIdToken(true);

      // 1) Create session cookie (httpOnly sb_auth) + send profile ON SIGNUP
      const sessionRes = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          profile: {
            name: signup.name,
            companyName: signup.companyName,
            companySize: signup.companySize,
            country: signup.country,
          },
        }),
      });

      if (!sessionRes.ok) throw new Error("Failed to create session.");

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong.");
    } finally {
      setLoadingSignup(false);
    }
  }

  async function onLoginSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoadingLogin(true);

    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        login.email,
        login.password
      );

      const idToken = await cred.user.getIdToken(true);

      // ✅ Login should NOT send profile (prevents overwriting stored fields)
      const sessionRes = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!sessionRes.ok) throw new Error("Failed to create session.");

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Invalid email/password.");
    } finally {
      setLoadingLogin(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-100 px-4">
      <div className="w-full max-w-5xl">
        <div className="relative overflow-hidden rounded-[32px] border border-white/60 bg-white/40 shadow-[0_30px_90px_-30px_rgba(2,6,23,0.3)] backdrop-blur-xl">
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/40 via-white/10 to-indigo-200/25" />

          <div className="relative grid grid-cols-1 md:grid-cols-2">
            {/* SIGN UP */}
            <section className="px-8 py-10 md:px-14 md:py-14 flex flex-col justify-center">
              <h1 className="text-3xl md:text-[40px] font-medium text-slate-700 text-center">
                Sign up
              </h1>

              <form onSubmit={onSignupSubmit} className="mt-8 space-y-4">
                <Input
                  placeholder="Name"
                  value={signup.name}
                  onChange={(e) =>
                    setSignup((s) => ({ ...s, name: e.target.value }))
                  }
                />

                <Input
                  type="email"
                  placeholder="Email"
                  value={signup.email}
                  onChange={(e) =>
                    setSignup((s) => ({ ...s, email: e.target.value }))
                  }
                />

                <Input
                  type="password"
                  placeholder="Password"
                  value={signup.password}
                  onChange={(e) =>
                    setSignup((s) => ({ ...s, password: e.target.value }))
                  }
                />

                <Input
                  placeholder="Company’s name"
                  value={signup.companyName}
                  onChange={(e) =>
                    setSignup((s) => ({ ...s, companyName: e.target.value }))
                  }
                />

                <Select
                  value={signup.companySize}
                  onChange={(e) =>
                    setSignup((s) => ({ ...s, companySize: e.target.value }))
                  }
                >
                  <option value="" disabled>
                    Company’s size
                  </option>
                  {COMPANY_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </Select>

                <Select
                  value={signup.country}
                  onChange={(e) =>
                    setSignup((s) => ({ ...s, country: e.target.value }))
                  }
                >
                  <option value="" disabled>
                    Country
                  </option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>

                <button
                  type="submit"
                  disabled={loadingSignup}
                  className="mt-3 h-12 w-full rounded-xl text-white font-medium shadow-lg
                             bg-gradient-to-r from-indigo-500 via-blue-600 to-violet-600
                             hover:brightness-105 active:translate-y-[1px]
                             focus:outline-none focus:ring-2 focus:ring-blue-500/30
                             disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loadingSignup ? "Creating..." : "Sign Up"}
                </button>

                <p className="text-center text-sm text-slate-600 md:hidden">
                  Already have an account?{" "}
                  <Link href="/login" className="text-blue-700 hover:underline">
                    Log in
                  </Link>
                </p>
              </form>
            </section>

            {/* DIVIDER */}
            <div className="hidden md:block fixed">
              <div className="absolute inset-y-10 left-0 w-px bg-slate-200/70" />
            </div>

            {/* LOG IN */}
            <section className="px-8 py-10 md:px-14 md:py-14 flex flex-col justify-center bg-white/10 border-t border-slate-200/50 md:border-t-0">
              <h2 className="text-3xl md:text-[40px] font-medium text-slate-700 text-center">
                Log In
              </h2>

              <form onSubmit={onLoginSubmit} className="mt-8 space-y-4">
                <Input
                  type="email"
                  placeholder="Email"
                  value={login.email}
                  onChange={(e) =>
                    setLogin((l) => ({ ...l, email: e.target.value }))
                  }
                />

                <Input
                  type="password"
                  placeholder="Password"
                  value={login.password}
                  onChange={(e) =>
                    setLogin((l) => ({ ...l, password: e.target.value }))
                  }
                />

                <div className="pt-1 text-center">
                  <button
                    type="button"
                    className="text-sm text-slate-600 hover:underline"
                    onClick={() => alert("Forgot password (later)")}
                  >
                    Forgot Password
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loadingLogin}
                  className="mt-3 h-12 w-full rounded-xl text-white font-medium shadow-lg
                             bg-gradient-to-r from-blue-700 via-blue-600 to-violet-600
                             hover:brightness-105 active:translate-y-[1px]
                             focus:outline-none focus:ring-2 focus:ring-blue-500/30
                             disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loadingLogin ? "Logging in..." : "Log In"}
                </button>

                <p className="hidden md:block text-center text-sm text-slate-600">
                  Don’t have an account?{" "}
                  <Link
                    href="/register"
                    className="text-blue-700 hover:underline"
                  >
                    Sign up
                  </Link>
                </p>
              </form>

              {error && (
                <p className="mt-4 text-sm text-center text-rose-700">{error}</p>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

/* UI helpers */

function Input(
  props: React.InputHTMLAttributes<HTMLInputElement> & { placeholder: string }
) {
  return (
    <input
      {...props}
      className="h-11 w-full rounded-xl px-4 text-sm
                 border border-slate-200 bg-white/80 text-slate-800
                 placeholder:text-slate-400 shadow-sm
                 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="h-11 w-full rounded-xl px-4 text-sm
                 border border-slate-200 bg-white/80 text-slate-700
                 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                 appearance-none"
    />
  );
}
