"use client";

import { createUserWithEmailAndPassword } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { auth } from "@/lib/firebase/clients";

type SupportedLanguage = "en" | "fr";

const LANGUAGES: Array<{ value: SupportedLanguage; label: string }> = [
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
];

const COMPANY_SIZES = [
  "1–10",
  "11–50",
  "51–200",
  "201–500",
  "501–1000",
  "1000+",
] as const;

const INDUSTRIES = [
  "Restaurant",
  "Ecommerce",
  "Retail",
  "Professional services",
  "Agency",
  "SaaS",
  "Healthcare",
  "Hospitality",
  "Education",
  "Other",
] as const;

const COUNTRIES = [
  "France",
  "United Kingdom",
  "United States",
  "Germany",
  "Spain",
  "Italy",
  "Portugal",
  "Canada",
  "Australia",
] as const;

type SignupState = {
  name: string;
  email: string;
  password: string;
  language: SupportedLanguage;
  companyName: string;
  companySize: string;
  industry: string;
  country: string;
};

export default function RegisterClient() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);

  const [signup, setSignup] = useState<SignupState>({
    name: "",
    email: "",
    password: "",
    language: "en",
    companyName: "",
    companySize: "",
    industry: "",
    country: "",
  });

  const [loadingSignup, setLoadingSignup] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step1Valid = useMemo(() => {
    return (
      signup.name.trim() !== "" &&
      signup.email.trim() !== "" &&
      signup.password.trim() !== "" &&
      signup.companyName.trim() !== ""
    );
  }, [signup]);

  const step2Valid = useMemo(() => {
    return (
      signup.companySize.trim() !== "" &&
      signup.industry.trim() !== "" &&
      signup.country.trim() !== ""
    );
  }, [signup]);

  function goToStep2() {
    setError(null);

    if (!step1Valid) {
      setError("Please complete all fields before continuing.");
      return;
    }

    setStep(2);
  }

  function goBackToStep1() {
    setError(null);
    setStep(1);
  }

  async function onSignupSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (step === 1) {
      goToStep2();
      return;
    }

    if (!step2Valid) {
      setError("Please complete all fields before creating your account.");
      return;
    }

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
            industry: signup.industry,
            country: signup.country,
            initialLanguage: signup.language,
          },
        }),
      });

      if (!sessionRes.ok) {
        throw new Error("Failed to create session.");
      }

      router.push("/billing");
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
        <div className="mb-4 flex justify-center">
          <img
            src="/brand/ser3bellum-logo-final.svg"
            alt="Ser3bellum"
            className="h-12 w-auto"
          />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="mb-5">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-slate-900">Sign up</h1>
              <span className="text-xs font-medium text-slate-500">
                Step {step} of 2
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              {step === 1
                ? "Create your account to get started"
                : "Tell us a bit about your business"}
            </p>

            <div className="mt-4 flex gap-2">
              <div
                className={`h-2 flex-1 rounded-full transition-all ${
                  step >= 1 ? "bg-blue-600" : "bg-slate-200"
                }`}
              />
              <div
                className={`h-2 flex-1 rounded-full transition-all ${
                  step >= 2 ? "bg-blue-600" : "bg-slate-200"
                }`}
              />
            </div>
          </div>

          <form onSubmit={onSignupSubmit} className="overflow-hidden">
            <div
              className={`flex w-[200%] transition-transform duration-300 ease-out ${
                step === 1 ? "translate-x-0" : "-translate-x-1/2"
              }`}
            >
              <div className="w-1/2 pr-3 space-y-3">
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
                    Language
                  </label>
                  <Select
                    value={signup.language}
                    onChange={(e) =>
                      setSignup((s) => ({
                        ...s,
                        language: e.target.value as SupportedLanguage,
                      }))
                    }
                  >
                    {LANGUAGES.map((language) => (
                      <option key={language.value} value={language.value}>
                        {language.label}
                      </option>
                    ))}
                  </Select>
                </div>

                {error && step === 1 && (
                  <p className="text-sm text-rose-600">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loadingSignup}
                  className="mt-2 h-11 w-full rounded-xl bg-blue-600 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Next
                </button>
              </div>

              <div className="w-1/2 pl-3 space-y-3">
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
                    Industry
                  </label>
                  <Select
                    value={signup.industry}
                    onChange={(e) =>
                      setSignup((s) => ({ ...s, industry: e.target.value }))
                    }
                  >
                    <option value="">Select industry</option>
                    {INDUSTRIES.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
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

                {error && step === 2 && (
                  <p className="text-sm text-rose-600">{error}</p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={goBackToStep1}
                    disabled={loadingSignup}
                    className="h-11 w-1/3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300/40 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    disabled={loadingSignup}
                    className="h-11 w-2/3 rounded-xl bg-blue-600 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loadingSignup ? "Creating account..." : "Create account"}
                  </button>
                </div>
              </div>
            </div>
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
