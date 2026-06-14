import Link from "next/link";

const steps = [
  {
    id: "step-1",
    title: "Create or review your workspace",
    description:
      "Make sure your company information is complete so Ser3bellum can personalise your dashboard.",
  },
  {
    id: "step-2",
    title: "Connect your integrations",
    description:
      "Connect tools such as Google Analytics, Shopify, Slack, or other supported providers.",
  },
  {
    id: "step-3",
    title: "Unlock your dashboard",
    description:
      "Once your workspace and integrations are ready, Ser3bellum can start displaying your business activity.",
  },
];

const benefits = [
  "Traffic visibility",
  "Provider health checks",
  "Alerts and summaries",
  "Operational insights",
];

export default function QuickStartPage() {
  return (
    <main className="space-y-8 px-6 py-8">
        <nav className="text-sm text-slate-500" aria-label="Breadcrumb">
  <ol className="flex items-center gap-2">
    <li>
      <Link href="/help" className="hover:text-slate-900">
        Help Center
      </Link>
    </li>
    <li>/</li>
    <li className="font-medium text-slate-900">Quick Start</li>
  </ol>
</nav>
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm lg:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="max-w-2xl">
            <div className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              Quick Start
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 lg:text-4xl">
              Set up Ser3bellum in a few steps
            </h1>

            <p className="mt-3 text-base leading-7 text-slate-600">
              Connect your tools, review your workspace, and start monitoring
              your business from one central dashboard.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white">
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
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-600/80 via-blue-600/90 to-indigo-600/70 px-5 py-3 text-sm font-medium text-white"
            >
              Review workspace
            </Link>

            <Link
              href="/settings/integrations"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Browse integrations
            </Link>
          </div>

          <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-5">
            <h3 className="text-sm font-medium text-slate-900">
              What you can do with Ser3bellum
            </h3>

            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {benefits.map((benefit) => (
                <div
                  key={benefit}
                  className="rounded-xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm"
                >
                  {benefit}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}