// app/(app)/site-health/page.tsx
import React from "react";
import Link from "next/link";

type HealthStatus = "healthy" | "attention" | "unknown";

type SiteHealthData = {
  status: HealthStatus;
  summary: string;
  lastUpdatedLabel: string; // e.g. "Not yet available" or "Today, 14:26"
  signals: {
    availability: {
      label: string; // e.g. "No data yet"
      detail: string;
      href: string;
    };
    incidents: {
      label: string;
      detail: string;
      href: string;
    };
    exposure: {
      label: string;
      detail: string;
      href?: string; // optional until you have a destination
    };
  };
};

export default function SiteHealthPage() {
  // TODO: Replace with real aggregated health data from your backend.
  // This is a safe placeholder state.
  const data: SiteHealthData = {
    status: "unknown",
    summary:
      "As monitoring and checks are enabled, this page will reflect the overall state of your site.",
    lastUpdatedLabel: "Not yet available",
    signals: {
      availability: {
        label: "No data yet",
        detail: "Uptime status will appear once monitors are enabled.",
        href: "/uptime", // adjust if your route differs (e.g. /dashboard/uptime)
      },
      incidents: {
        label: "No incidents",
        detail: "Incident history will appear once monitoring is active.",
        href: "/incidents", // adjust if your route differs
      },
      exposure: {
        label: "Not enabled",
        detail:
          "Exposure indicators (e.g. configuration or vulnerability signals) will appear when available.",
        // href: "/settings/security" // optional later
      },
    },
  };

  const statusUI = getStatusUI(data.status);

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Site Health
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          An overview of your website’s reliability and risk indicators
        </p>
      </div>

      <div className="grid gap-6">
        {/* Overall status */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span
                  className={[
                    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
                    statusUI.pillClassName,
                  ].join(" ")}
                >
                  {statusUI.pillLabel}
                </span>

                <span className="text-xs text-slate-500">
                  Last updated: {data.lastUpdatedLabel}
                </span>
              </div>

              <h2 className="mt-3 text-lg font-semibold text-slate-900">
                Your site’s health, at a glance
              </h2>
              <p className="mt-1 text-sm text-slate-600">{data.summary}</p>
            </div>

            {/* Optional right-side helper */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 md:w-[360px]">
              <p className="font-medium text-slate-900">What this means</p>
              <p className="mt-1">
                Site Health summarizes the key signals that affect availability,
                reliability, and exposure — so you can quickly tell if anything
                needs attention.
              </p>
            </div>
          </div>
        </div>

        {/* Signals grid */}
        <div className="grid gap-4 md:grid-cols-3">
          <SignalCard
            title="Availability"
            label={data.signals.availability.label}
            detail={data.signals.availability.detail}
            href={data.signals.availability.href}
            cta="View uptime"
          />

          <SignalCard
            title="Incidents"
            label={data.signals.incidents.label}
            detail={data.signals.incidents.detail}
            href={data.signals.incidents.href}
            cta="View incidents"
          />

          <SignalCard
            title="Exposure"
            label={data.signals.exposure.label}
            detail={data.signals.exposure.detail}
            href={data.signals.exposure.href}
            cta={data.signals.exposure.href ? "View details" : undefined}
          />
        </div>

        {/* Lightweight “what will live here” section */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">
            What you’ll see here
          </h3>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <InfoRow
              title="Availability"
              text="Uptime status and recent downtime signals."
            />
            <InfoRow
              title="Reliability"
              text="Incident patterns, anomalies, and performance-related signals."
            />
            <InfoRow
              title="Exposure"
              text="Configuration or vulnerability indicators when available."
            />
          </div>

          <p className="mt-4 text-xs text-slate-500">
            This page is designed to be a calm summary — not a setup wizard.
          </p>
        </div>
      </div>
    </div>
  );
}

function SignalCard(props: {
  title: string;
  label: string;
  detail: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-900">{props.title}</p>

      <div className="mt-3">
        <p className="text-2xl font-semibold text-slate-900">{props.label}</p>
        <p className="mt-1 text-sm text-slate-600">{props.detail}</p>
      </div>

      {props.href && props.cta ? (
        <Link
          href={props.href}
          className="mt-4 inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
        >
          {props.cta}
          <span className="ml-2 text-slate-400">→</span>
        </Link>
      ) : (
        <p className="mt-4 text-xs text-slate-500">
          Not available yet.
        </p>
      )}
    </div>
  );
}

function InfoRow(props: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-medium text-slate-900">{props.title}</p>
      <p className="mt-1 text-sm text-slate-600">{props.text}</p>
    </div>
  );
}

function getStatusUI(status: HealthStatus) {
  switch (status) {
    case "healthy":
      return {
        pillLabel: "Healthy",
        pillClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    case "attention":
      return {
        pillLabel: "Needs attention",
        pillClassName: "border-amber-200 bg-amber-50 text-amber-800",
      };
    case "unknown":
    default:
      return {
        pillLabel: "Status unavailable",
        pillClassName: "border-slate-200 bg-slate-50 text-slate-700",
      };
  }
}
