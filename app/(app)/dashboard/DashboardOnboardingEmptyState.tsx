"use client";

import Link from "next/link";

export function DashboardOnboardingEmptyState() {
  const steps = [
    {
      id: "step-1",
      title: "Create your company",
      description:
        "Set up your workspace with your company name and basic details so Ser3bellum can personalise your dashboard.",
    },
    {
      id: "step-2",
      title: "Connect your first provider",
      description:
        "Plug in a service like Google Analytics to start pulling in website and operational data.",
    },
    {
      id: "step-3",
      title: "Unlock your dashboard",
      description:
        "Once connected, Ser3bellum will surface analytics, health signals, and actionable insights in one place.",
    },
  ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm lg:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="max-w-2xl">
          <div className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            Welcome to Ser3bellum
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 lg:text-4xl">
            Let’s set up your workspace
          </h1>

          <p className="mt-3 text-base leading-7 text-slate-600">
            Start by creating your company and connecting your first provider.
            Once setup is complete, your dashboard will begin surfacing traffic,
            monitoring, and operational insights in one place.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-400 text-sm font-semibold text-white">
                {index + 1}
              </div>

              <h2 className="mt-4 text-lg font-medium text-slate-900">
                {step.title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/user-settings"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white bg-gradient-to-br from-blue-600/80 via-blue-600/90 to-indigo-600/70 hover:bg-slate-800"
          >
            Create company
          </Link>

          <Link
            href="settings/integrations"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Connect a provider
          </Link>
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-5">
          <h3 className="text-sm font-medium text-slate-900">
            What you’ll get after setup
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
              Traffic visibility
            </div>
            <div className="rounded-xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
              Provider health checks
            </div>
            <div className="rounded-xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
              Alerts and summaries
            </div>
            <div className="rounded-xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
              Operational insights
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}