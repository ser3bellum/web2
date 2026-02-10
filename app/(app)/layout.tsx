// app/(app)/layout.tsx
import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebase/admin';

import DailyReportModalController from '@/app/(app)/components/DailyReportModalController';
import { Sidebar } from '@/app/(app)/components/Sidebar';
import { TopBar } from '@/app/(app)/components/TopBar'; // keep your working import

export default async function AppLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const session = cookieStore.get('sb_auth')?.value;

  if (!session) redirect('/login');

  try {
    await adminAuth.verifySessionCookie(session, true);
  } catch {
    redirect('/login');
  }

 return (
  // app/(app)/layout.tsx (inside return)
<div className="flex h-screen overflow-hidden">
  <Sidebar />

  <div className="flex min-w-0 flex-1 flex-col app-gradient">
    <DailyReportModalController />

    <TopBar companyName="Ser3bellum" />

    {/* KEY PART: pull content under the header */}
    <main className="flex-1 overflow-y-auto bg-transparent -mt-[72px] pt-[72px]">
      {children}
    </main>
  </div>
</div>

);

}
