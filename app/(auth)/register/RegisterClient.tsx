"use client";

import { createUserWithEmailAndPassword } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { auth } from "@/lib/firebase/clients";

const COMPANY_SIZES = [
  "1–10",
  "11–50",
  "51–200",
  "201–500",
  "501–1000",
  "1000+",
];

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

  const [loadingSignup, setLoadingSignup] = useState(false);
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-4 flex justify-center">
          <div className="text-4xl font-light tracking-tight">
           <img
					src="/brand/ser3bellum-logo-final.svg"
					alt="Ser3bellum"
					className="h-12 w-auto"
				/>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
          <h1 className="text-2xl font-semibold text-slate-900">Sign up</h1>
          <p className="mt-2 text-sm text-slate-500">
            Create your account to get started
          </p>

          <form onSubmit={onSignupSubmit} className="mt-5 space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Name
              </label>
              <Input
                placeholder="Your name"
                value={signup.name}
                onChange={(e) =>
                  setSignup((s) => ({ ...s, name: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <Input
                type="email"
                placeholder="you@company.com"
                value={signup.email}
                onChange={(e) =>
                  setSignup((s) => ({ ...s, email: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Password
              </label>
              <Input
                type="password"
                placeholder="Create a password"
                value={signup.password}
                onChange={(e) =>
                  setSignup((s) => ({ ...s, password: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Company name
              </label>
              <Input
                placeholder="Your company"
                value={signup.companyName}
                onChange={(e) =>
                  setSignup((s) => ({ ...s, companyName: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Company size
              </label>
              <Select
                value={signup.companySize}
                onChange={(e) =>
                  setSignup((s) => ({ ...s, companySize: e.target.value }))
                }
              >
                <option value="">Select company size</option>
                {COMPANY_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Country
              </label>
              <Select
                value={signup.country}
                onChange={(e) =>
                  setSignup((s) => ({ ...s, country: e.target.value }))
                }
              >
                <option value="">Select country</option>
                {COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </Select>
            </div>

            {error && (
              <p className="text-sm text-rose-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loadingSignup}
              className="mt-2 h-11 w-full rounded-xl bg-blue-600 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingSignup ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:underline">
              Log in
            </Link>
          </p>
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
      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
    />
  );
}
