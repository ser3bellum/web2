"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import SettingsCard from "./components/SettingsCard";
import FieldRow from "./components/FieldRow";

async function saveCompany(company: {
  companyName?: string;
  website?: string;
  companySize?: string;
  companyActivity?: string;
  vatId?: string;
  country?: string;// optional: if you have them in the form
  apiKeys?: Record<string, string>; // e.g. { uptimeRobot: "...", sendgrid: "..." }
}) {
  const res = await fetch("/api/company/update", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(company),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Save failed");
  return data;
}


type Props = {
  user: {
    id: string;
    email: string;
    name: string;
    companyName: string;
    companyId: string | null;
  };
};

export default function UserSettingsClient({ user }: Props) {
  const router = useRouter();

  // local form state (you can expand later)
  const [profileName, setProfileName] = useState(user.name);
  const [role, setRole] = useState("");
  const [authority, setAuthority] = useState("Admin");

  const [companyName, setCompanyName] = useState(user.companyName);
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [companyActivity, setCompanyActivity] = useState("");
  const [isSavingCompany, setIsSavingCompany] = useState(false);
    const [companySaved, setCompanySaved] = useState(false);


  const emailLabel = useMemo(() => user.email || "—", [user.email]);

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        {/* User chip */}
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-slate-200" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              User Settings
            </h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
              <span>{emailLabel}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                {authority}
              </span>
            </div>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={() => router.push("/dashboard")}
          aria-label="Close settings"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white
                     text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        >
          ✕
        </button>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* LEFT */}
        <div className="flex flex-col gap-6">
          <SettingsCard
            title="Profile"
            subtitle="This is how others will see you on the site."
          >
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-slate-200" />
              <div className="flex gap-2">
                <button className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800">
                  Change
                </button>
                <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">
                  Remove
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {/* NOTE: FieldRow currently doesn’t expose onChange in your snippet.
                 If FieldRow supports it, wire it. If not, we’ll adjust FieldRow next. */}
              <FieldRow label="Username" value={profileName} placeholder="Your name" onChange={setProfileName} />
              <FieldRow label="Email" value={user.email} disabled />
              <FieldRow label="Role" value={role} placeholder="CTO"  onChange={setRole}/>
              <FieldRow label="Authority" select options={["Admin", "Editor", "Viewer"]} value={authority} placeholder="Admin"
            onChange={setAuthority} />
            </div>

            <div className="mt-6">
              <button className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800">
                Save profile
              </button>
            </div>
          </SettingsCard>

          <SettingsCard
            title="Team Management"
            subtitle="Invite and manage your team members."
          >
            <div className="grid gap-4">
              <FieldRow label="Member's Email" placeholder="name@example.com" />
              <FieldRow
                label="Role"
                placeholder="Editor"
                select
                options={["Admin", "Editor", "Viewer"]}
              />
            </div>

            <div className="mt-6">
              <button className="w-full rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800">
                Add Member
              </button>
              <p className="mt-2 text-xs text-slate-500">Admin only.</p>
            </div>
          </SettingsCard>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-6">
          <SettingsCard
            title="Change Password"
            subtitle="Update your password here. Please choose a strong password."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FieldRow
                label="Current Password"
                placeholder="••••••••"
                type="password"
              />
              <FieldRow label="New Password" placeholder="••••••••" type="password" />
              <div className="md:col-span-2">
                <FieldRow
                  label="Confirm New Password"
                  placeholder="••••••••"
                  type="password"
                />
              </div>
            </div>

            <div className="mt-6">
              <button className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800">
                Update Password
              </button>
            </div>
          </SettingsCard>

          <SettingsCard
            title="Company Infos"
            subtitle="Manage your company's information."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FieldRow label="Company Name" value={companyName} placeholder="Company name"  onChange={setCompanyName} />
              <FieldRow label="Company Website" value={companyWebsite} placeholder="https://example.com" onChange={setCompanyWebsite} />
              <FieldRow label="Number of Employees" placeholder="Select a size"
                select options={["1–10", "11–50", "51–200", "201–1000", "1000+"]}
                value={companySize}
                onChange={setCompanySize} />
              <FieldRow label="Type of Activity" value={companyActivity} placeholder="Technology" onChange={setCompanyActivity} />
            </div>

            <div className="mt-6">
             <button
  disabled={isSavingCompany}
  onClick={async () => {
    setIsSavingCompany(true);
    setCompanySaved(false);

    try {
      const data = await saveCompany({
        companyName,
        website: companyWebsite,
        companySize,
        companyActivity,
        // country, vatId, apiKeys...
      });

      // ✅ update the UI with what the server actually stored (incl https:// normalisation)
      if (data?.workspace) {
        setCompanyName(data.workspace.name ?? companyName);
        setCompanyWebsite(data.workspace.website ?? companyWebsite);
        setCompanySize(data.workspace.companySize ?? companySize);
        setCompanyActivity(data.workspace.activity ?? companyActivity);
      }

      setCompanySaved(true);
      setTimeout(() => setCompanySaved(false), 1500);

      router.refresh(); // ✅ re-hydrate server data too (keeps everything consistent)
    } catch (e: any) {
      console.error(e);
      // TODO: show toast
    } finally {
      setIsSavingCompany(false);
    }
  }}
  className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
>
  {isSavingCompany ? "Saving…" : companySaved ? "Saved ✓" : "Save company"}
</button>

            </div>
          </SettingsCard>

          <SettingsCard
            title="Billing Information"
            subtitle="Manage your billing details and payment methods."
          >
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
              <div>
                <div className="text-sm font-medium text-slate-900">
                  Visa ending in 1234
                </div>
                <div className="text-xs text-slate-500">Expires 12/2025</div>
              </div>
              <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">
                Edit
              </button>
            </div>

            <div className="mt-4">
              <FieldRow
                label="Billing Address"
                placeholder="1234 Main St, Anytown, USA 12345"
              />
            </div>

            <div className="mt-6">
              <button className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800">
                Save billing
              </button>
              <p className="mt-2 text-xs text-slate-500">Admin only.</p>
            </div>
          </SettingsCard>
        </div>
      </div>
    </div>
  );
}
