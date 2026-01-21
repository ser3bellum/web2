import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/app/(app)/components/Sidebar";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get("sb_auth")?.value === "1";

  if (!isAuthed) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto app-gradient">{children}</main>
    </div>
  );
}
