// app/(app)/dashboard/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import DashboardCardsGrid from "app/(app)/components/DashboardCardsGrid";
import { getDashboardKpis } from "app/(app)/dashboard/dashboardKpis";
import { parseDashboardRange } from "app/(app)/lib/dateRange";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserCompanyContext } from "@/lib/data/getUserCompanyContext";
import { KpiStrip } from "./KpiStrip";
import { getDashboardHydration } from "app/(app)/dashboard/getDashboardHydration";
import { DashboardOnboardingEmptyState } from "./DashboardOnboardingEmptyState";

type DashboardSearchParams = { from?: string; to?: string };

const isDev = process.env.NODE_ENV === "development";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: DashboardSearchParams | Promise<DashboardSearchParams>;
}) {
  try {
    const sp = searchParams ? await Promise.resolve(searchParams) : {};
    const range = parseDashboardRange(sp);

    const session = (await cookies()).get("__Host-sb_auth")?.value;
    if (!session) redirect("/login");

    const { company } = await getUserCompanyContext(session);
    if (!company?.id) {
      return (
    <div className="px-4 pb-8 pt-6 lg:px-8">
      <DashboardOnboardingEmptyState />
    </div>
     );

    }

    const kpis = await getDashboardKpis({
      range,
      companyId: company.id,
    });

    const hydration = await getDashboardHydration({
      from: range.from,
      to: range.to,
      endUserId: company.id,
    });

    return (
      <div className="flex flex-col">
        <div className="flex flex-col gap-6 px-4 pb-8 pt-6 lg:px-8">
          <KpiStrip kpis={kpis} />

          <section>
            <DashboardCardsGrid hydrationCards={hydration.cards} />
          </section>

          {isDev && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="text-sm font-semibold text-slate-800">
                Hydration (debug)
              </div>
              <pre className="mt-2 overflow-auto text-xs text-slate-700">
                {JSON.stringify(hydration, null, 2)}
              </pre>
            </section>
          )}
        </div>
      </div>
    );
  } catch (e: any) {
    console.error("DASHBOARD_SSR_CRASH:", e?.message, e?.stack, e);
    throw e;
  }
}
