export const dynamic = "force-dynamic";
export const revalidate = 0;

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import HistoryContent from "./HistoryContent";
import { getUserCompanyContext } from "@/lib/data/getUserCompanyContext";
import { getDailyReports } from "@/lib/firestore/getDailyReports";

export default async function HistoryPage() {
	const session = (await cookies()).get("__Host-sb_auth")?.value;

	if (!session) {
		redirect("/login");
	}

	const { user } = await getUserCompanyContext(session);

	if (!user?.id) {
		redirect("/login");
	}

	const reports = await getDailyReports(user.id);

	return (
		<main className="flex min-h-full flex-1 flex-col">
			<div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8 lg:px-8">
				<header>
					<h1 className="text-2xl font-semibold tracking-tight text-slate-900">
						History
					</h1>

					<p className="mt-1 text-sm text-slate-500">
						Review your reports and past business insights.
					</p>
				</header>

				{reports.length === 0 ? (
					<HistoryEmptyState />
				) : (
					<HistoryContent reports={reports} />
				)}
			</div>
		</main>
	);
}

function HistoryEmptyState() {
	return (
		<section className="flex flex-1 items-center justify-center py-16">
			<div className="flex max-w-md flex-col items-center text-center">
				<div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
					<HistoryIcon />
				</div>

				<h2 className="mt-5 text-lg font-semibold text-slate-900">
					No history yet
				</h2>

				<p className="mt-2 text-sm leading-6 text-slate-500">
					Your first report will appear here after Ser3bellum
					completes its first 24-hour analysis cycle.
				</p>
			</div>
		</section>
	);
}

function HistoryIcon() {
	return (
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			aria-hidden="true"
			className="text-slate-500"
		>
			<path
				d="M3 12a9 9 0 1 0 3-6.7L3 8"
				stroke="currentColor"
				strokeWidth="1.8"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M3 3v5h5"
				stroke="currentColor"
				strokeWidth="1.8"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M12 7v5l3 2"
				stroke="currentColor"
				strokeWidth="1.8"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}