// app/(app)/user-settings/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserCompanyContext } from "@/lib/data/getUserCompanyContext";

import UserSettingsClient from "./UserSettingsClient";

export default async function UserSettingsPage() {
  const session = (await cookies()).get("sb_auth")?.value;
  if (!session) redirect("/login");

  const { user, company } = await getUserCompanyContext(session);
  if (!user) redirect("/login");

  return (
    <UserSettingsClient
      user={{
        id: user.id,
        email: user.email ?? "",
        name: user.name ?? "",
        companyName: company?.name ?? user.companyName ?? "",
        companyId: user.companyId ?? null,
      }}
    />
  );
}
