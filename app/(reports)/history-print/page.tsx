export const dynamic = "force-dynamic";
export const revalidate = 0;

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getUserCompanyContext } from "@/lib/data/getUserCompanyContext";
import { getDailyReportsByIds } from "@/lib/firestore/getDailyReportsByIds";

import { HistoricalReport } from "../components/HistoricalReport";
import { ReportShell } from "../components/ReportShell";
import { AutoPrint } from "../components/AutoPrint";

type HistoryPrintSearchParams = {
	ids?: string;
	preview?: string;
};

function formatReportDate(
	value: string,
	locale: string,
) {
	const date = new Date(`${value}T00:00:00Z`);

	if (Number.isNaN(date.getTime())) {
		return value;
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

export default async function HistoryPrintPage({
	searchParams,
}: {
	searchParams?:
		| HistoryPrintSearchParams
		| Promise<HistoryPrintSearchParams>;
}) {
	const params = searchParams
		? await Promise.resolve(searchParams)
		: {};

	const session = (await cookies()).get(
		"__Host-sb_auth",
	)?.value;

	if (!session) {
		redirect("/login");
	}

	const { user, company } =
		await getUserCompanyContext(session);

	if (!user?.id) {
		redirect("/login");
	}

	const reportIds = (params.ids ?? "")
		.split(",")
		.map((id) => id.trim())
		.filter(Boolean);

	if (reportIds.length === 0) {
		redirect("/history");
	}

	const reports = await getDailyReportsByIds(
		user.id,
		reportIds,
	);

	if (reports.length === 0) {
		redirect("/history");
	}

	const language = user.initialLanguage ?? "en";
	const isFrench =
		language.toLowerCase().startsWith("fr");

	const locale = isFrench ? "fr-FR" : "en-GB";

	const companyName = getCompanyName(company);

	return (
		<>
			{reports.map((report, index) => {
				const formattedFrom = formatReportDate(
					report.period.from,
					locale,
				);

				const formattedTo = formatReportDate(
					report.period.to,
					locale,
				);

				const generatedAt =
					new Intl.DateTimeFormat(locale, {
						dateStyle: "medium",
						timeStyle: "short",
						timeZone: "UTC",
					}).format(
						new Date(report.generatedAt),
					);

				const periodLabel = isFrench
					? `Période : ${formattedFrom} – ${formattedTo}`
					: `Period: ${formattedFrom} – ${formattedTo}`;

				const generatedLabel = isFrench
					? `Généré le ${generatedAt} UTC`
					: `Generated ${generatedAt} UTC`;

				return (
					<div
						key={report.reportId}
						className={
							index < reports.length - 1
								? "history-print-report break-after-page"
								: "history-print-report"
						}
					>
						<ReportShell
							title={
								isFrench
									? "Rapport quotidien"
									: "Daily report"
							}
							companyName={companyName}
							periodLabel={periodLabel}
							generatedLabel={generatedLabel}
						>
							<HistoricalReport
								report={report}
							/>
						</ReportShell>
					</div>
				);
			})}

			<AutoPrint
				ready={reports.length > 0}
				enabled={params.preview !== "1"}
			/>
		</>
	);
}