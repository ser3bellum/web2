export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getUserCompanyContext } from "@/lib/data/getUserCompanyContext";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { getLatestSavedAIInsight } from "@/lib/firestore/getLatestSavedAIInsight";
import type { AIInsightPayload } from "@/types/ai";
import { DashboardReport } from "../../components/DashboardReport";
import { ReportShell } from "../../components/ReportShell";
import { getDashboardHydration } from "app/(app)/dashboard/getDashboardHydration";
import { getDashboardKpis } from "app/(app)/dashboard/dashboardKpis";
import { parseDashboardRange } from "app/(app)/lib/dateRange";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type DashboardPrintSearchParams = {
  from?: string;
  to?: string;
  preview?: string;
};

function toDate(value: string | Date) {
  if (value instanceof Date) return value;

  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T00:00:00Z`
    : value;

  return new Date(normalized);
}

function formatReportDate(
  value: string | Date,
  locale: string,
) {
  const date = toDate(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}

function getCompanyName(company: unknown) {
  if (!company || typeof company !== "object") {
    return undefined;
  }

  const data = company as Record<string, unknown>;

  const candidate =
    data.name ??
    data.companyName ??
    data.displayName;

  return typeof candidate === "string" &&
    candidate.trim().length > 0
    ? candidate
    : undefined;
}

export default async function DashboardPrintPage({
  searchParams,
}: {
  searchParams?:
    | DashboardPrintSearchParams
    | Promise<DashboardPrintSearchParams>;
}) {
  const params = searchParams
    ? await Promise.resolve(searchParams)
    : {};

  const range = parseDashboardRange({
    from: params.from,
    to: params.to,
  });

  const session = (await cookies()).get(
    "__Host-sb_auth",
  )?.value;

  if (!session) {
    redirect("/login");
  }

  const { user, company } =
    await getUserCompanyContext(session);

  if (!user?.id || !company?.id) {
    redirect("/dashboard");
  }

  const language = user.initialLanguage ?? "en";
  const isFrench = language.toLowerCase().startsWith("fr");
  const locale = isFrench ? "fr-FR" : "en-GB";

  const [hydration, savedAIInsight] = await Promise.all([
    getDashboardHydration({
      from: range.from,
      to: range.to,
      endUserId: user.id,
    }),
    getLatestSavedAIInsight(user.id),
  ]);

  const kpis = await getDashboardKpis({
    range,
    companyId: company.id,
    hydration,
  });

  const aiInsight: AIInsightPayload =
    savedAIInsight ?? {
      status: "empty",
      headline: "",
      whyItMatters: "",
      recommendedAction: "",
      sourceNote: "",
    };

  const dictionary = await getDictionary(language);

  const formattedFrom = formatReportDate(
    range.from,
    locale,
  );

  const formattedTo = formatReportDate(
    range.to,
    locale,
  );

  const generatedAt = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date());

  const periodLabel = isFrench
    ? `Période : ${formattedFrom} – ${formattedTo}`
    : `Period: ${formattedFrom} – ${formattedTo}`;

  const generatedLabel = isFrench
    ? `Généré le ${generatedAt} UTC`
    : `Generated ${generatedAt} UTC`;

  return (
    <ReportShell
      title={
        isFrench
          ? "Rapport de performance"
          : "Performance report"
      }
      companyName={getCompanyName(company)}
      periodLabel={periodLabel}
      generatedLabel={generatedLabel}
    >
      <DashboardReport
        hydration={hydration}
        kpis={kpis}
        labels={dictionary.dashboard}
        aiInsight={aiInsight}
        autoPrint={params.preview !== "1"}
      />
    </ReportShell>
  );
}