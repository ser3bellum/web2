"use client";

import { useRouter } from "next/navigation";
import SettingsCard from "./components/SettingsCard";
import FieldRow from "./components/FieldRow";

export default function UserSettingsPage() {
  const router = useRouter();

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
              <span>info@ser3bellum.com</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                Admin
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
        {/* LEFT COLUMN */}

        {/* LEFT */}
        <div className="flex flex-col gap-6">
          <SettingsCard title="Profile" subtitle="This is how others will see you on the site.">
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
              <FieldRow label="Username" placeholder="Your name" />
              <FieldRow label="Email" value="info@ser3bellum.com" disabled />
              <FieldRow label="Role" placeholder="CTO" />
              <FieldRow label="Authority" placeholder="Admin" select options={["Admin", "Editor", "Viewer"]} />
            </div>

            <div className="mt-6">
              <button className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800">
                Save profile
              </button>
            </div>
          </SettingsCard>

          <SettingsCard title="Team Management" subtitle="Invite and manage your team members.">
            <div className="grid gap-4">
              <FieldRow label="Member's Email" placeholder="name@example.com" />
              <FieldRow label="Role" placeholder="Editor" select options={["Admin", "Editor", "Viewer"]} />
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
          <SettingsCard title="Change Password" subtitle="Update your password here. Please choose a strong password.">
            <div className="grid gap-4 md:grid-cols-2">
              <FieldRow label="Current Password" placeholder="••••••••" type="password" />
              <FieldRow label="New Password" placeholder="••••••••" type="password" />
              <div className="md:col-span-2">
                <FieldRow label="Confirm New Password" placeholder="••••••••" type="password" />
              </div>
            </div>

            <div className="mt-6">
              <button className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800">
                Update Password
              </button>
            </div>
          </SettingsCard>

          <SettingsCard title="Company Infos" subtitle="Manage your company's information.">
            <div className="grid gap-4 md:grid-cols-2">
              <FieldRow label="Company Name" placeholder="SentryView Inc." />
              <FieldRow label="Company Website" placeholder="https://sentryview.dev" />
              <FieldRow
                label="Number of Employees"
                placeholder="Select a size"
                select
                options={["1–10", "11–50", "51–200", "201–1000", "1000+"]}
              />
              <FieldRow label="Type of Activity" placeholder="Technology" />
            </div>

            <div className="mt-6">
              <button className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800">
                Save company
              </button>
            </div>
          </SettingsCard>

          <SettingsCard title="Billing Information" subtitle="Manage your billing details and payment methods.">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
              <div>
                <div className="text-sm font-medium text-slate-900">Visa ending in 1234</div>
                <div className="text-xs text-slate-500">Expires 12/2025</div>
              </div>
              <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">
                Edit
              </button>
            </div>

            <div className="mt-4">
              <FieldRow label="Billing Address" placeholder="1234 Main St, Anytown, USA 12345" />
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
