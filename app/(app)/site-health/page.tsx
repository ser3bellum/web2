import Link from "next/link";
import {
  getDictionary,
  type Dictionary,
} from "@/lib/i18n/getDictionary";

type HealthStatus = "healthy" | "attention" | "unknown";

type SiteHealthData = {
  status: HealthStatus;
  summary: string;
  lastUpdatedLabel: string;
  signals: {
    availability: {
      label: string;
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
      href?: string;
    };
  };
};

export default async function SiteHealthPage() {
  const user = {
    initialLanguage: "fr" as const,
  };

  const dictionary = await getDictionary(user.initialLanguage);
  const labels = dictionary.siteHealth;

  const data: SiteHealthData = {
    status: "unknown",
    summary: labels.summaryDescription,
    lastUpdatedLabel: "Not yet available",
    signals: {
      availability: {
        label: labels.signals.availability.emptyLabel,
        detail: labels.signals.availability.detail,
        href: "/uptime",
      },
      incidents: {
        label: labels.signals.incidents.emptyLabel,
        detail: labels.signals.incidents.detail,
        href: "/incidents",
      },
      exposure: {
        label: labels.signals.exposure.emptyLabel,
        detail: labels.signals.exposure.detail,
      },
    },
  };

  const statusUI = getStatusUI(data.status, labels);

  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {labels.title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {labels.subtitle}
        </p>
      </div>

      <div className="grid gap-6">
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
                  {labels.lastUpdated}: {data.lastUpdatedLabel}
                </span>
              </div>

              <h2 className="mt-3 text-lg font-semibold text-slate-900">
                {labels.summaryTitle}
              </h2>
              <p className="mt-1 text-sm text-slate-600">{data.summary}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 md:w-[360px]">
              <p className="font-medium text-slate-900">{labels.helper.title}</p>
              <p className="mt-1">{labels.helper.description}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SignalCard
            title={labels.signals.availability.title}
            label={data.signals.availability.label}
            detail={data.signals.availability.detail}
            href={data.signals.availability.href}
            cta={labels.signals.availability.cta}
            unavailableLabel={labels.signals.exposure.unavailable}
          />

          <SignalCard
            title={labels.signals.incidents.title}
            label={data.signals.incidents.label}
            detail={data.signals.incidents.detail}
            href={data.signals.incidents.href}
            cta={labels.signals.incidents.cta}
            unavailableLabel={labels.signals.exposure.unavailable}
          />

          <SignalCard
            title={labels.signals.exposure.title}
            label={data.signals.exposure.label}
            detail={data.signals.exposure.detail}
            href={data.signals.exposure.href}
            cta={data.signals.exposure.href ? labels.signals.exposure.cta : undefined}
            unavailableLabel={labels.signals.exposure.unavailable}
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">
            {labels.infoSection.title}
          </h3>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <InfoRow
              title={labels.infoSection.availability.title}
              text={labels.infoSection.availability.text}
            />
            <InfoRow
              title={labels.infoSection.reliability.title}
              text={labels.infoSection.reliability.text}
            />
            <InfoRow
              title={labels.infoSection.exposure.title}
              text={labels.infoSection.exposure.text}
            />
          </div>

          <p className="mt-4 text-xs text-slate-500">
            {labels.infoSection.footer}
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
  unavailableLabel: string;
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
        <p className="mt-4 text-xs text-slate-500">{props.unavailableLabel}</p>
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

function getStatusUI(
  status: HealthStatus,
  labels: Dictionary["siteHealth"],
) {
  switch (status) {
    case "healthy":
      return {
        pillLabel: labels.status.healthy,
        pillClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    case "attention":
      return {
        pillLabel: labels.status.attention,
        pillClassName: "border-amber-200 bg-amber-50 text-amber-800",
      };
    default:
      return {
        pillLabel: labels.status.unavailable,
        pillClassName: "border-slate-200 bg-slate-50 text-slate-700",
      };
  }
}