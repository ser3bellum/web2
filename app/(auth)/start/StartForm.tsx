"use client";

import Link from "next/link";
import { useState } from "react";

type StartFormState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  companySize: string;
  industry: string;
  language: string;
  role: string;
  country: string;
  termsAccepted: boolean;
};

const initialState: StartFormState = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  companyName: "",
  companySize: "",
  industry: "",
  language: "en",
  role: "",
  country: "",
  termsAccepted: false,
};

export function StartForm() {
  const [form, setForm] = useState<StartFormState>(initialState);

  function updateField<K extends keyof StartFormState>(
    key: K,
    value: StartFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    console.log("Start form submitted", form);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#eee9ff] via-[#eef3ff] to-[#dcecff] px-6 py-12 text-slate-800">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-4xl rounded-[2rem] border border-white/80 bg-white/40 px-10 py-10"
        >
          <div className="mx-auto grid max-w-2xl py-5 gap-x-10 gap-y-5 md:grid-cols-2">
            <Field
              label="Name*"
              value={form.name}
              onChange={(value) => updateField("name", value)}
            />

            <Field
              label="Company name*"
              value={form.companyName}
              onChange={(value) => updateField("companyName", value)}
            />

            <Field
              label="Email*"
              type="email"
              value={form.email}
              onChange={(value) => updateField("email", value)}
            />

            <SelectField
              label="Company size*"
              value={form.companySize}
              onChange={(value) => updateField("companySize", value)}
              options={[
                { value: "", label: "Select company size" },
                { value: "1-10", label: "1–10" },
                { value: "11-50", label: "11–50" },
                { value: "51-200", label: "51–200" },
                { value: "201-500", label: "201–500" },
                { value: "500+", label: "500+" },
              ]}
            />

            <Field
              label="Password*"
              type="password"
              value={form.password}
              onChange={(value) => updateField("password", value)}
            />


            <SelectField
              label="Industry*"
              value={form.industry}
              onChange={(value) => updateField("industry", value)}
              options={[
                { value: "", label: "Select industry" },
                { value: "ecommerce", label: "E-commerce" },
                { value: "hospitality", label: "Hospitality" },
                { value: "marketing", label: "Marketing / Agency" },
                { value: "retail", label: "Retail" },
                { value: "services", label: "Services" },
                { value: "other", label: "Other" },
              ]}
            />

            <Field
             label="Confirm password*"
             type="password"
             value={form.confirmPassword}
             onChange={(value) => updateField("confirmPassword", value)}
            />
            
            <SelectField
              label="Language"
              value={form.language}
              onChange={(value) => updateField("language", value)}
              options={[
                { value: "en", label: "English" },
                { value: "fr", label: "French" },
              ]}
            />

            <Field
              label="Role"
              value={form.role}
              onChange={(value) => updateField("role", value)}
            />

            <SelectField
              label="Country*"
              value={form.country}
              onChange={(value) => updateField("country", value)}
              options={[
                { value: "", label: "Select country" },
                { value: "FR", label: "France" },
                { value: "GB", label: "United Kingdom" },
                { value: "IE", label: "Ireland" },
                { value: "DE", label: "Germany" },
                { value: "ES", label: "Spain" },
                { value: "IT", label: "Italy" },
                { value: "OTHER", label: "Other" },
              ]}
            />

            <label className="flex items-center gap-3 pt-4 text-sm leading-5 text-slate-600 md:col-span-2">
              <input
                type="checkbox"
                checked={form.termsAccepted}
                onChange={(event) =>
                  updateField("termsAccepted", event.target.checked)
                }
                className="mt-1 h-4 w-4 rounded border-slate-300"
              />
              <span>
                I have read and agree with the{" "}
                <Link href="/terms" className="font-medium text-blue-600">
                  Terms & Conditions
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="font-medium text-blue-600">
                  Privacy Policy
                </Link>
                . Registration confirmation will be emailed to you.
              </span>
            </label>

            <button
              type="submit"
              className="mt-4 h-12 rounded-xl bg-gradient-to-r from-violet-500 via-blue-400 to-violet-300 text-base font-semibold text-white shadow-lg shadow-blue-300/30 transition hover:scale-[1.01] md:col-span-2"
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "password";
};

function Field({ label, value, onChange, type = "text" }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-600">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white/45 px-4 text-sm outline-none ring-blue-400/20 transition focus:border-blue-400 focus:ring-4"
      />
    </label>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
};

function SelectField({ label, value, onChange, options }: SelectFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-600">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-slate-200 bg-white/45 px-4 text-sm outline-none ring-blue-400/20 transition focus:border-blue-400 focus:ring-4"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}