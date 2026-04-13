import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserCompanyContext } from "@/lib/data/getUserCompanyContext";
import { getDictionary } from "@/lib/i18n/getDictionary";
import IntegrationsClient from "./IntegrationsClient";

export default async function IntegrationsPage() {
  const session = (await cookies()).get("__Host-sb_auth")?.value;
  if (!session) redirect("/login");

  const { user } = await getUserCompanyContext(session);
  if (!user) redirect("/login");

  const dictionary = getDictionary(user.initialLanguage);

  return <IntegrationsClient dictionary={dictionary} />;
}
