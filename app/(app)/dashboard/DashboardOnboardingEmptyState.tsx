"use client";

import Link from "next/link";

type DashboardOnboardingEmptyStateProps = {
  hasCompany: boolean;
  hasIntegration: boolean;
};

export function DashboardOnboardingEmptyState({
  hasCompany,
  hasIntegration,
}: DashboardOnboardingEmptyStateProps) {
  const steps = [
    {
      id: "step-1",
      title: "Create your company",
      description:
        "Set up your workspace with your company name and basic details so Ser3bellum can personalise your dashboard.",
      completed: hasCompany,
    },
    {
      id: "step-2",
      title: "Connect your first provider",
      description:
        "Plug in a service like Google Analytics to start pulling in website and operational data.",
      completed: hasIntegration,
    },
    {
      id: "step-3",
      title: "Unlock your dashboard",
      description:
        "Once connected, Ser3bellum will surface analytics, health signals, and actionable insights in one place.",
      completed: hasCompany && hasIntegration,
    },
  ];

  const allDone = hasCompany && hasIntegration;

  const heading = allDone
    ? "Your dashboard is ready"
    : hasCompany
      ? "Connect your first provider"
      : "Let’s set up your workspace";

  const description = allDone
    ? "Your workspace is configured. Start exploring your dashboard and integrations."
    : hasCompany
      ? "Your company is set up. Connect your first provider to start surfacing traffic, monitoring, and operational insights."
      : "Start by creating your company and connecting your first provider. Once setup is complete, your dashboard will begin surfacing traffic, monitoring, and operational insights in one place.";

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm lg:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="max-w-2xl">
          <div className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            Welcome to Ser3bellum
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 lg:text-4xl">
            {heading}
          </h1>

          <p className="mt-3 text-base leading-7 text-slate-600">
            {description}
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`rounded-2xl border p-5 ${
                step.completed
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white ${
                  step.completed ? "bg-emerald-500" : "bg-blue-500"
                }`}
              >
                {step.completed ? "✓" : index + 1}
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

        {!allDone && (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {!hasCompany ? (
              <Link
                href="/user-settings"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-600/80 via-blue-600/90 to-indigo-600/70 px-5 py-3 text-sm font-medium text-white"
              >
                Create company
              </Link>
            ) : (
              <Link
                href="/settings/integrations"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-600/80 via-blue-600/90 to-indigo-600/70 px-5 py-3 text-sm font-medium text-white"
              >
                Connect your first provider
              </Link>
            )}

            {!hasIntegration && hasCompany && (
              <Link
                href="/settings/integrations"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Browse integrations
              </Link>
            )}

            {!hasCompany && (
              <Link
                href="/settings/integrations"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                View integrations
              </Link>
            )}
          </div>
        )}

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