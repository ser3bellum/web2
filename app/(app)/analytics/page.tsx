
import React from "react";
import Link from "next/link";


type IntegrationStatus = {
  googleAnalyticsConnected: boolean;
  shopifyConnected: boolean;
};

export default function AnalyticsPage() {
  // TODO: Replace with real integration status from Firebase / your backend.
  const status: IntegrationStatus = {
    googleAnalyticsConnected: false,
    shopifyConnected: false,
  };

  const isActive =
    status.googleAnalyticsConnected || status.shopifyConnected;

  return (
    <div className="px-6 py-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Business performance, correlated with system health
        </p>
      </div>

      {!isActive ? (
        <EmptyState />
      ) : (
        <ActiveState status={status} />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="grid gap-6">
      {/* Primary empty state block */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Connect your business data
          </h2>
          <p className="text-sm text-slate-500">
            Ser3bellum brings traffic, sales, and system reliability into one
            place. Connect Google Analytics and/or Shopify to see how incidents,
            latency, and downtime impact real business outcomes.
          </p>
        </div>

       {/* Integration cards */}
<div className="mt-6 grid gap-4 md:grid-cols-2">
  <IntegrationCard
    title="Google Analytics"
    subtitle="Website traffic & engagement"
    bullets={[
      "Sessions & users",
      "Traffic sources",
      "Key engagement signals",
    ]}
    ctaLabel="Connect Google Analytics"
    hint="Correlate traffic spikes with latency and errors"
    href="/settings/integrations/google-analytics"
  />

  <IntegrationCard
    title="Shopify"
    subtitle="Sales & conversions"
    bullets={[
      "Orders & revenue",
      "Conversion rate",
      "Checkout performance",
    ]}
    ctaLabel="Connect Shopify"
    hint="Understand how incidents affect sales in real time"
    href="/settings/integrations/shopify"
  />
</div>

        </div>

        {/* Preview insight teaser */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700">
              {/* sparkle icon */}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M12 2l1.2 5.2L18 8.4l-4.8 1.2L12 15l-1.2-5.4L6 8.4l4.8-1.2L12 2z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path
                  d="M19 14l.7 3 3 0.7-3 .7-.7 3-.7-3-3-.7 3-.7.7-3z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">
                Example insight
              </p>
              <p className="mt-1 text-sm text-slate-600">
                “On Jan 5, a latency increase of +180ms coincided with a 12%
                drop in checkout conversions.”
              </p>
            </div>
          </div>
        </div>

        {/* Footer microcopy */}
        <p className="mt-4 text-xs text-slate-500">
          Analytics is optional and only activated when integrations are
          connected.
        </p>
      </div>
   
  );
}

function IntegrationCard(props: {
  title: string;
  subtitle: string;
  bullets: string[];
  ctaLabel: string;
  hint: string;
  href: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">{props.title}</p>
          <p className="mt-1 text-sm text-slate-500">{props.subtitle}</p>
        </div>

        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
          Optional
        </span>
      </div>

      <ul className="mt-4 space-y-2 text-sm">
        {props.bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-slate-700">
            <span className="mt-1 inline-block h-2 w-2 rounded-full bg-slate-300" />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <Link
        href={props.href}
        className="mt-5 block w-full rounded-xl bg-slate-900 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-slate-800 active:bg-slate-950"
      >
        {props.ctaLabel}
      </Link>

      <p className="mt-3 text-xs text-slate-500">{props.hint}</p>
    </div>
  );
}

function ActiveState({ status }: { status: IntegrationStatus }) {
  return (
    <div className="grid gap-6">
      {/* Top summary tiles */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Sessions" value="—" sub="Connect GA to populate" />
        <MetricCard label="Revenue" value="—" sub="Connect Shopify to populate" />
        <MetricCard label="Conversion rate" value="—" sub="Connect Shopify to populate" />
      </div>

      {/* Correlation timeline placeholder */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Timeline correlation
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Overlay traffic and revenue with incidents, downtime, and latency.
            </p>
          </div>

          <div className="text-xs text-slate-500">
            Connected:{" "}
            {[
              status.googleAnalyticsConnected ? "GA" : null,
              status.shopifyConnected ? "Shopify" : null,
            ]
              .filter(Boolean)
              .join(" + ") || "None"}
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          Chart placeholder (v1): Sessions/Revenue line + incident markers +
          downtime blocks + P95 latency spikes.
        </div>
      </div>

      {/* Automated insights placeholder */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Automated insights
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Short, rules-based insights that connect business impact to reliability.
        </p>

        <div className="mt-5 grid gap-3">
          <InsightRow text="Revenue dropped during a recorded incident (example placeholder)." />
          <InsightRow text="Traffic peaked while latency increased above threshold (example placeholder)." />
          <InsightRow text="Conversion rate decreased following downtime (example placeholder)." />
        </div>
      </div>
    </div>
  );
}

function MetricCard(props: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{props.label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{props.value}</p>
      <p className="mt-2 text-xs text-slate-500">{props.sub}</p>
    </div>
  );
}

function InsightRow({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
      {text}
    </div>
  );
}
