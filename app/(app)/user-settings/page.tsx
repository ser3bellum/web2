import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserCompanyContext } from "@/lib/data/getUserCompanyContext";
import UserSettingsClient from "./UserSettingsClient";

export default async function UserSettingsPage() {
  const session = (await cookies()).get("__Host-sb_auth")?.value;
  if (!session) redirect("/login");

  const { user, company } = await getUserCompanyContext(session);
  if (!user) redirect("/login");

  return (
    <UserSettingsClient
      user={{
        id: user.id,
        email: user.email ?? "",
        name: user.name ?? "",
        avatarUrl: user.avatarUrl ?? null,
        jobTitle: user.jobTitle ?? "",
        initialLanguage: user.initialLanguage,
      }}
      company={{
        id: company?.id ?? null,
        name: company?.name ?? "",
        website: company?.website ?? "",
        companySize: company?.companySize ?? "",
        activity: company?.activity ?? "",
        vatId: company?.vatId ?? "",
        country: company?.country ?? "",
      }}
    />
  );
}
