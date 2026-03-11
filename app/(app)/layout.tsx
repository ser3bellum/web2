// app/(app)/layout.tsx
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

  const endUserId = user?.id ?? user?.id ?? null;

  let slackConnected = false;
  let googleAnalyticsConnected = false;

  if (endUserId) {
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
  }

  return (
    <div className="flex h-screen overflow-hidden">
     <Sidebar
	companyName={company?.name ?? user?.companyName ?? "Company"}
	userEmail={user?.email ?? ""}
	userName={user?.name ?? ""}
	avatarUrl={user?.avatarUrl ?? null}
	endUserId={"test_nicole_tshumba"}
/>

      <div className="flex min-w-0 flex-1 flex-col app-gradient">
        <DailyReportModalController />

        <TopBar companyName={company?.name ?? user?.companyName ?? "Ser3bellum"} />

        <main className="flex-1 overflow-y-auto bg-transparent -mt-[72px] pt-[72px]">
          {children}
        </main>
      </div>
    </div>
  );
}