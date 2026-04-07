import Link from "next/link";
import {
  getDictionary,
  type Dictionary,
} from "@/lib/i18n/getDictionary";

type IntegrationStatus = {
  googleAnalyticsConnected: boolean;
  shopifyConnected: boolean;
};

export default async function AnalyticsPage() {
  const user = {
    initialLanguage: "fr" as const,
  };

  const dictionary = await getDictionary(user.initialLanguage);
  const labels = dictionary.analytics;

  const status: IntegrationStatus = {
    googleAnalyticsConnected: false,
    shopifyConnected: false,
  };

  const isActive =
    status.googleAnalyticsConnected || status.shopifyConnected;

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

      {!isActive ? (
        <EmptyState labels={labels.emptyState} />
      ) : (
       <ActiveState status={status} labels={labels.activeState} />
      )}
    </div>
  );
}

function EmptyState({
  labels,
}: {
  labels: Dictionary["analytics"]["emptyState"];
}) {
  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-slate-900">
            {labels.title}
          </h2>
          <p className="text-sm text-slate-500">
            {labels.description}
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <IntegrationCard
            title={labels.googleAnalytics.title}
            subtitle={labels.googleAnalytics.subtitle}
            bullets={[
              labels.googleAnalytics.bullets.sessionsAndUsers,
              labels.googleAnalytics.bullets.trafficSources,
              labels.googleAnalytics.bullets.keyEngagementSignals,
            ]}
            ctaLabel={labels.googleAnalytics.cta}
            hint={labels.googleAnalytics.hint}
            optionalLabel={labels.optional}
            href="/settings/integrations/google-analytics"
          />

          <IntegrationCard
            title={labels.shopify.title}
            subtitle={labels.shopify.subtitle}
            bullets={[
              labels.shopify.bullets.ordersAndRevenue,
              labels.shopify.bullets.conversionRate,
              labels.shopify.bullets.checkoutPerformance,
            ]}
            ctaLabel={labels.shopify.cta}
            hint={labels.shopify.hint}
            optionalLabel={labels.optional}
            href="/settings/integrations/shopify"
          />
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700">
            ✨
          </div>

          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900">
              {labels.exampleInsightLabel}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              “{labels.exampleInsightText}”
            </p>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">{labels.footer}</p>
    </div>
  );
}

function IntegrationCard(props: {
  title: string;
  subtitle: string;
  bullets: string[];
  ctaLabel: string;
  hint: string;
  optionalLabel: string;
  href: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {props.title}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {props.subtitle}
          </p>
        </div>

        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
          {props.optionalLabel}
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

function ActiveState({
  status,
  labels,
}: {
  status: IntegrationStatus;
  labels: Dictionary["analytics"]["activeState"];
})  {
	return (
		<div className="grid gap-6">
			{/* Top summary tiles */}
			<div className="grid gap-4 md:grid-cols-3">
				<MetricCard
  				label={labels.metricCards.sessions}
  				value="—"
 				sub={labels.metricCards.connectGaToPopulate}
				/>
				<MetricCard
  				label={labels.metricCards.revenue}
 				value="—"
  				sub={labels.metricCards.connectShopifyToPopulate}
				/>
				<MetricCard
  				label={labels.metricCards.conversionRate}
  				value="—"
  				sub={labels.metricCards.connectShopifyToPopulate}
				/>
			</div>

			{/* Correlation timeline placeholder */}
			<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex items-start justify-between gap-4">
					<div>
						<h2>{labels.timeline.title}</h2>
						<p>{labels.timeline.description}</p>
					</div>

					<div className="text-xs text-slate-500">
						 {labels.timeline.connectedLabel}{" "}
  {[
    status.googleAnalyticsConnected ? "GA" : null,
    status.shopifyConnected ? "Shopify" : null,
  ]
    .filter(Boolean)
    .join(" + ") || labels.timeline.none}
					</div>
				</div>

				<div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
					{labels.timeline.chartPlaceholder}
				</div>
			</div>

			{/* Automated insights placeholder */}
			<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
				<h2>{labels.insights.title}</h2>
				<p>{labels.insights.description}</p>

				<div className="mt-5 grid gap-3">
					<InsightRow text={labels.insights.revenueDropped} />
					<InsightRow text={labels.insights.trafficPeaked} />
					<InsightRow text={labels.insights.conversionRateDecreased} />
				</div>
			</div>
		</div>
	);
}

function MetricCard(props: { label: string; value: string; sub: string }) {
	return (
		<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<p className="text-sm text-slate-500">{props.label}</p>
			<p className="mt-2 text-2xl font-semibold text-slate-900">
				{props.value}
			</p>
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
