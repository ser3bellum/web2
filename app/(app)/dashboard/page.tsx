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

type DashboardSearchParams = { from?: string; to?: string };

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
        <div className="px-6 py-10">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="mt-2 text-slate-600">No company linked to your account yet.</p>
        </div>
      );
    }

    const kpis = await getDashboardKpis({
      range,
      companyId: company.id,
    });

    return (
      <div className="flex flex-col">
        <div className="flex flex-col gap-6 px-4 pb-8 pt-6 lg:px-8">
          <KpiStrip kpis={kpis} />
          <section>
            <DashboardCardsGrid />
          </section>
        </div>
      </div>
    );
  } catch (e: any) {
    // ✅ THIS is what will show the real error in Cloud Run logs
    console.error("DASHBOARD_SSR_CRASH:", e?.message, e?.stack, e);
    throw e;
  }
}
