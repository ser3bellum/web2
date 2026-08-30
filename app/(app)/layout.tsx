export const dynamic = "force-dynamic";
export const revalidate = 0;

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import DailyReportModalController from "@/app/(app)/components/DailyReportModalController";
import { Sidebar } from "@/app/(app)/components/Sidebar";
import { TopBar } from "@/app/(app)/components/TopBar";
import { getUserCompanyContext } from "@/lib/data/getUserCompanyContext";
import { adminAuth } from "@/lib/firebase/admin";
import { findNangoConnectionId } from "@/lib/nango/findConnectionId";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { TrialBanner } from "@/app/(app)/components/billing/trialBanner";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const session = cookieStore.get("__Host-sb_auth")?.value;

  if (!session) redirect("/login");

  try {
    await adminAuth.verifySessionCookie(session, true);
  } catch (e) {
    console.error("APP_LAYOUT_SESSION_REJECTED:", e);
    redirect("/login");
  }

  const { user, company } = await getUserCompanyContext(session);

  if (!user?.id) redirect("/login");

  const endUserId = user.id;
  const dictionary = getDictionary(user.initialLanguage);

  let slackConnected = false;
  let googleAnalyticsConnected = false;

  try {
    await findNangoConnectionId({
      providerConfigKey:
        process.env.NANGO_SLACK_PROVIDER_CONFIG_KEY || "slack",
      endUserId,
    });
    slackConnected = true;
  } catch {
    slackConnected = false;
  }

  try {
    await findNangoConnectionId({
      providerConfigKey:
        process.env.NANGO_GOOGLE_ANALYTICS_PROVIDER_CONFIG_KEY ||
        "google-analytics",
      endUserId,
    });
    googleAnalyticsConnected = true;
  } catch {
    googleAnalyticsConnected = false;
  }

  function serializeDate(value: unknown): string | null {
    if (!value) return null;
    if (typeof value === "string") return value;
    if (value instanceof Date) return value.toISOString();

    if (
      typeof value === "object" &&
      "toDate" in value &&
      typeof value.toDate === "function"
    ) {
      return value.toDate().toISOString();
    }

    return null;
  }

  const trialEnd = serializeDate(user.trialEnd ?? user.accessUntil);

  return (
    <div className="flex h-dvh min-w-0 overflow-hidden">
      <Sidebar
        companyName={company?.name ?? user?.companyName ?? "Company"}
        userEmail={user?.email ?? ""}
        userName={user?.name ?? ""}
        avatarUrl={user?.avatarUrl ?? null}
        endUserId={endUserId}
        dictionary={dictionary}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden app-gradient">
        <DailyReportModalController workspaceId={company?.id ?? user.id} />

        <TopBar
          companyName={company?.name ?? user?.companyName ?? "Ser3bellum"}
          dictionary={dictionary}
        />

        <main className="-mt-16 min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-transparent pt-16 md:-mt-[72px] md:pt-[72px]">
          <div className="px-4 pt-6 lg:px-8">
            <TrialBanner
              billingStatus={
                user.billingStatus ?? user.subscriptionStatus ?? ""
              }
              trialEnd={trialEnd}
              cancelAtPeriodEnd={user.cancelAtPeriodEnd ?? false}
            />
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
