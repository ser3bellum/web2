// app/(app)/dashboard/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getDictionary } from "@/lib/i18n/getDictionary";
import DashboardCardsGrid from "app/(app)/components/DashboardCardsGrid";
import { getDashboardKpis } from "app/(app)/dashboard/dashboardKpis";
import { parseDashboardRange } from "app/(app)/lib/dateRange";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserCompanyContext } from "@/lib/data/getUserCompanyContext";
import { SelectableKpiStrip } from "./SelectableKpiStrip";
import { getDashboardHydration } from "app/(app)/dashboard/getDashboardHydration";
import { DashboardOnboardingEmptyState } from "./DashboardOnboardingEmptyState";
import { findNangoConnectionId } from "@/lib/nango/findConnectionId";
import { TrialBanner } from "../components/billing/trialBanner";
import { NANGO_INTEGRATION_ID } from "app/(app)/lib/integrations";
import { buildSyncSummaryFromHydrationCards } from "@/lib/ai/buildSyncSummary";
import { saveSyncSummary } from "@/lib/firestore/saveSyncSummary";

type DashboardSearchParams = { from?: string; to?: string };
const isDev = process.env.NODE_ENV === "development";

export default async function DashboardPage({ searchParams }: {
  searchParams?: DashboardSearchParams | Promise<DashboardSearchParams>;
}) {
  const sp = searchParams ? await Promise.resolve(searchParams) : {};
  const range = parseDashboardRange(sp);
  const session = (await cookies()).get("__Host-sb_auth")?.value;
  if (!session) redirect("/login");
  const { user, company } = await getUserCompanyContext(session);
  const dictionary = await getDictionary(user?.initialLanguage ?? "en");

  if (!company?.id || !user?.id) {
    return (
      <div className="px-4 pb-8 pt-6 lg:px-8">
        <DashboardOnboardingEmptyState hasCompany={Boolean(company?.id)} hasIntegration={false} labels={dictionary.dashboard.onboarding} />
      </div>
    );
  }
  const endUserId = user.id;
  const providerConfigKeys = [...new Set(Object.values(NANGO_INTEGRATION_ID))];
  const connectionResults = await Promise.all(providerConfigKeys.map(async (providerConfigKey) => {
    try {
      const connectionId = await findNangoConnectionId({ providerConfigKey, endUserId });
      return { providerConfigKey, connected: Boolean(connectionId) };
    } catch { return { providerConfigKey, connected: false }; }
  }));
  if (!connectionResults.some((item) => item.connected)) {
    return (
      <div className="px-4 pb-8 pt-6 lg:px-8">
        <DashboardOnboardingEmptyState hasCompany={true} hasIntegration={false} labels={dictionary.dashboard.onboarding} />
      </div>
    );
  }
  const hydration = await getDashboardHydration({ from: range.from, to: range.to, endUserId });
  const kpis = await getDashboardKpis({ range, companyId: company.id, hydration });

  // Persist the SAME real hydration that feeds cards/KPIs. No second provider fetch for AI.
  let aiSyncRunId: string | null = null;
  if (user.lastWorkspaceId === company.id) {
    try {
      const summary = buildSyncSummaryFromHydrationCards({
        workspaceId: company.id, syncSource: "login_refresh",
        hydrationCards: hydration.cards ?? [], businessSources: hydration.businessSources,
        dateWindow: { from: hydration.range.from, to: hydration.range.to },
      });
      const saved = await saveSyncSummary(summary);
      aiSyncRunId = saved.syncRunId;
    } catch { console.error("DASHBOARD_AI_SUMMARY_SAVE_FAILED"); }
  }

  return (
    <div className="flex w-full flex-col">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 pb-8 pt-6 lg:px-8">
        <TrialBanner
          billingStatus={user.billingStatus ?? user.subscriptionStatus ?? ""}
          trialEnd={user.trialEnd ?? user.accessUntil ?? null}
          cancelAtPeriodEnd={user.cancelAtPeriodEnd ?? false}
        />
        <SelectableKpiStrip kpis={kpis} labels={dictionary.dashboard.kpis} />
        <section>
          <DashboardCardsGrid
            hydrationCards={hydration?.cards ?? []} labels={dictionary.dashboard}
            endUserId={endUserId} workspaceId={endUserId} aiSyncRunId={aiSyncRunId}
          />
        </section>
        {isDev && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="text-sm font-semibold text-slate-800">Hydration (debug)</div>
            <pre className="mt-2 overflow-auto text-xs text-slate-700">{JSON.stringify(hydration, null, 2)}</pre>
          </section>
        )}
      </div>
    </div>
  );
}
