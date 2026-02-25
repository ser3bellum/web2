// app/(app)/layout.tsx

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import DailyReportModalController from "@/app/(app)/components/DailyReportModalController";
import { Sidebar } from "@/app/(app)/components/Sidebar";
import { TopBar } from "@/app/(app)/components/TopBar";
import { getUserCompanyContext } from "@/lib/data/getUserCompanyContext";
import { adminAuth } from "@/lib/firebase/admin";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();

  // ✅ correct cookie name + temporary fallback (remove fallback later)
  const session =
    cookieStore.get("")?.value ??
    cookieStore.get("sb_auth")?.value;

  if (!session) redirect("/login");

  try {
    // ✅ most likely correct call shape
    await adminAuth.verifySessionCookie(session, true);
  } catch {
    redirect("/login");
  }

  const { user, company } = await getUserCompanyContext(session);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        companyName={company?.name ?? user?.companyName ?? "Company"}
        userEmail={user?.email ?? ""}
        userName={user?.name ?? ""}
        avatarUrl={user?.avatarUrl ?? null}
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
