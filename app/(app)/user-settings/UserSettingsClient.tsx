"use client";

import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { auth } from "@/lib/firebase/clients";
import type { SupportedLanguage } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/getDictionary";
import FieldRow from "./components/FieldRow";
import SettingsCard from "./components/SettingsCard";
import { LanguageSettingsCard } from "./components/LanguageSettingsCard";

async function saveProfile(payload: { name?: string; jobTitle?: string }) {
  const res = await fetch("/api/user/update", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || data?.message || "Save failed");
  }

  return data as {
    ok: boolean;
    user?: {
      name?: string;
      jobTitle?: string;
      avatarUrl?: string | null;
    } | null;
  };
}

async function openCustomerPortal() {
  const res = await fetch("/api/stripe/customer-portal", {
    method: "POST",
    credentials: "include",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data?.url) {
    throw new Error(data?.error || "Unable to open billing portal");
  }

  window.location.href = data.url;
}

async function saveCompany(company: {
  companyName?: string;
  website?: string;
  companySize?: string;
  companyActivity?: string;
  vatId?: string;
  country?: string;
  apiKeys?: Record<string, string>;
}) {
  const res = await fetch("/api/company/update", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(company),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || "Save failed");
  }

  return data;
}

async function uploadAvatar(file: File) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch("/api/user/avatar", {
    method: "POST",
    body: form,
    credentials: "include",
  });

  const raw = await res.text();

  let data: any = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { raw };
  }

  if (!res.ok) {
    throw new Error(
      data?.error || data?.message || `Upload failed (${res.status})`,
    );
  }

  return data as { ok: boolean; avatarUrl: string };
}

type Props = {
  user: {
    id: string;
    email: string;
    name: string;
    initialLanguage: SupportedLanguage;
    jobTitle?: string;
    avatarUrl?: string | null;
  };
  company: {
    id: string | null;
    name: string;
    website: string;
    companySize: string;
    activity: string;
    vatId: string;
    country: string;
  };
  dictionary: Dictionary;
};

export default function UserSettingsClient({
  user,
  company,
  dictionary,
}: Props) {
  const router = useRouter();
  const t = dictionary.settings;

  const fileRef = useRef<HTMLInputElement | null>(null);

  const [avatarPreview, setAvatarPreview] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    user.avatarUrl ?? null,
  );

  const [profileName, setProfileName] = useState(user.name ?? "");
  const [role, setRole] = useState(user.jobTitle ?? "");
  const [authority, setAuthority] = useState("Admin");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState(company.name ?? "");
  const [companyWebsite, setCompanyWebsite] = useState(company.website ?? "");
  const [companySize, setCompanySize] = useState(company.companySize ?? "");
  const [companyActivity, setCompanyActivity] = useState(company.activity ?? "");
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [companySaved, setCompanySaved] = useState(false);

  const initialLanguage = user.initialLanguage;
  const emailLabel = useMemo(() => user.email || "—", [user.email]);

  const profileDirty =
    profileName !== (user.name ?? "") || role !== (user.jobTitle ?? "");

  const passwordDirty =
    currentPassword.length > 0 ||
    newPassword.length > 0 ||
    confirmPassword.length > 0;

  const passwordsMatch = newPassword === confirmPassword;
  const passwordValid = newPassword.length >= 8;

  useEffect(() => {
    setCompanyName(company.name ?? "");
    setCompanyWebsite(company.website ?? "");
    setCompanySize(company.companySize ?? "");
    setCompanyActivity(company.activity ?? "");
  }, [company.name, company.website, company.companySize, company.activity]);

  useEffect(() => {
    setProfileName(user.name ?? "");
    setRole(user.jobTitle ?? "");
    setAvatarUrl(user.avatarUrl ?? null);
  }, [user.name, user.jobTitle, user.avatarUrl]);

  return (
    <div className="px-6 py-6">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 overflow-hidden rounded-full bg-slate-200">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : null}
          </div>

          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              {t.title}
            </h1>

            <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
              <span>{emailLabel}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                {authority}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          aria-label={t.closeSettings}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="flex flex-col gap-6">
          <SettingsCard title={t.profileTitle} subtitle={t.profileSubtitle}>
            <div className="flex items-center gap-4">
              <div className="relative h-14 w-14 overflow-hidden rounded-full bg-slate-200">
                <img
                  src={avatarPreview || avatarUrl || "/avatar-placeholder.png"}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;

                    if (!f.type.startsWith("image/")) {
                      console.error("Not an image");
                      return;
                    }

                    setAvatarPreview(URL.createObjectURL(f));
                    setIsUploadingAvatar(true);

                    try {
                      const data = await uploadAvatar(f);
                      setAvatarUrl(data.avatarUrl);
                      setAvatarPreview("");
                      router.refresh();
                    } catch (err) {
                      console.error(err);
                      setAvatarPreview("");
                    } finally {
                      setIsUploadingAvatar(false);
                      if (fileRef.current) fileRef.current.value = "";
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
                >
                  {isUploadingAvatar ? t.uploading : t.changeAvatar}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAvatarPreview("");
                    setAvatarUrl(null);
                    router.refresh();
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                >
                  {t.removeAvatar}
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              <FieldRow
                label={t.username}
                value={profileName}
                placeholder={t.yourName}
                onChange={setProfileName}
              />
              <FieldRow label={t.email} value={user.email} disabled />
              <FieldRow
                label={t.role}
                value={role}
                placeholder="CTO"
                onChange={setRole}
              />
              <FieldRow
                label={t.authority}
                select
                options={["Admin", "Editor", "Viewer"]}
                value={authority}
                placeholder="Admin"
                onChange={setAuthority}
              />
            </div>

            <div className="mt-6">
              <button
                type="button"
                disabled={isSavingProfile || !profileDirty}
                onClick={async () => {
                  setIsSavingProfile(true);
                  setProfileSaved(false);

                  try {
                    const data = await saveProfile({
                      name: profileName,
                      jobTitle: role,
                    });

                    if (data?.user?.name !== undefined) {
                      setProfileName(data.user.name ?? "");
                    }
                    if (data?.user?.jobTitle !== undefined) {
                      setRole(data.user.jobTitle ?? "");
                    }

                    setProfileSaved(true);
                    setTimeout(() => setProfileSaved(false), 1500);
                    router.refresh();
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setIsSavingProfile(false);
                  }
                }}
                className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
              >
                {isSavingProfile
                  ? t.saving
                  : profileSaved
                    ? t.saved
                    : t.saveProfile}
              </button>
            </div>
          </SettingsCard>

          <LanguageSettingsCard
            userId={user.id}
            initialLanguage={initialLanguage}
            dictionary={dictionary}
          />

          <SettingsCard title={t.teamManagement} subtitle={t.teamSubtitle}>
            <div className="grid gap-4">
              <FieldRow
                label={t.memberEmail}
                placeholder={t.memberEmailPlaceholder}
              />
              <FieldRow
                label={t.role}
                placeholder="Editor"
                select
                options={["Admin", "Editor", "Viewer"]}
              />
            </div>

            <div className="mt-6">
              <button
                type="button"
                className="w-full rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800"
              >
                {t.addMember}
              </button>
              <p className="mt-2 text-xs text-slate-500">{t.adminOnly}</p>
            </div>
          </SettingsCard>
        </div>

        <div className="flex flex-col gap-6">
          <SettingsCard
            title={t.changePassword}
            subtitle={t.changePasswordSubtitle}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FieldRow
                label={t.currentPassword}
                placeholder="••••••••"
                type="password"
                value={currentPassword}
                onChange={setCurrentPassword}
              />
              <FieldRow
                label={t.newPassword}
                placeholder="••••••••"
                type="password"
                value={newPassword}
                onChange={setNewPassword}
              />
              <div className="md:col-span-2">
                <FieldRow
                  label={t.confirmNewPassword}
                  placeholder="••••••••"
                  type="password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                disabled={
                  isSavingPassword ||
                  !passwordDirty ||
                  !passwordsMatch ||
                  !passwordValid
                }
                onClick={async () => {
                  setIsSavingPassword(true);
                  setPasswordSaved(false);
                  setPasswordError(null);

                  try {
                    const userAuth = auth.currentUser;
                    if (!userAuth?.email) {
                      throw new Error(t.notAuthenticatedInBrowser);
                    }

                    const cred = EmailAuthProvider.credential(
                      userAuth.email,
                      currentPassword,
                    );
                    await reauthenticateWithCredential(userAuth, cred);
                    await updatePassword(userAuth, newPassword);

                    setPasswordSaved(true);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setTimeout(() => setPasswordSaved(false), 1500);
                  } catch (e: any) {
                    console.error(e);

                    const code = e?.code as string | undefined;
                    if (
                      code === "auth/wrong-password" ||
                      code === "auth/invalid-credential"
                    ) {
                      setPasswordError(t.currentPasswordIncorrect);
                    } else if (code === "auth/weak-password") {
                      setPasswordError(t.newPasswordWeak);
                    } else if (code === "auth/requires-recent-login") {
                      setPasswordError(t.loginAgainToChangePassword);
                    } else {
                      setPasswordError(e?.message || t.passwordUpdateFailed);
                    }
                  } finally {
                    setIsSavingPassword(false);
                  }
                }}
                className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
              >
                {isSavingPassword
                  ? t.updating
                  : passwordSaved
                    ? t.updated
                    : t.updatePassword}
              </button>

              {!passwordsMatch && confirmPassword.length > 0 ? (
                <p className="mt-2 text-xs text-red-600">
                  {t.passwordsDoNotMatch}
                </p>
              ) : null}

              {passwordError ? (
                <p className="mt-2 text-xs text-red-600">{passwordError}</p>
              ) : null}
            </div>
          </SettingsCard>

          <SettingsCard title={t.companyInfos} subtitle={t.companySubtitle}>
            <div className="grid gap-4 md:grid-cols-2">
              <FieldRow
                label={t.companyName}
                value={companyName}
                placeholder={t.companyNamePlaceholder}
                onChange={setCompanyName}
              />
              <FieldRow
                label={t.companyWebsite}
                value={companyWebsite}
                placeholder={t.companyWebsitePlaceholder}
                onChange={setCompanyWebsite}
              />
              <FieldRow
                label={t.numberOfEmployees}
                placeholder={t.companySizePlaceholder}
                select
                options={["1–10", "11–50", "51–200", "201–1000", "1000+"]}
                value={companySize}
                onChange={setCompanySize}
              />
              <FieldRow
                label={t.typeOfActivity}
                value={companyActivity}
                placeholder={t.companyActivityPlaceholder}
                onChange={setCompanyActivity}
              />
            </div>

            <div className="mt-6">
              <button
                type="button"
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
                    });

                    if (data?.workspace) {
                      setCompanyName(data.workspace.name ?? companyName);
                      setCompanyWebsite(
                        data.workspace.website ?? companyWebsite,
                      );
                      setCompanySize(data.workspace.companySize ?? companySize);
                      setCompanyActivity(
                        data.workspace.activity ?? companyActivity,
                      );
                    }

                    setCompanySaved(true);
                    setTimeout(() => setCompanySaved(false), 1500);
                    router.refresh();
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setIsSavingCompany(false);
                  }
                }}
                className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
              >
                {isSavingCompany
                  ? t.saving
                  : companySaved
                    ? t.saved
                    : t.saveCompany}
              </button>
            </div>
          </SettingsCard>

          <SettingsCard
            title={t.billingInformation}
            subtitle={t.billingSubtitle}
          >
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
              <div>
                <div className="text-sm font-medium text-slate-900">
                  Visa ending in 1234
                </div>
                <div className="text-xs text-slate-500">Expires 12/2025</div>
              </div>
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                {t.edit}
              </button>
            </div>

            <div className="mt-4">
              <FieldRow
                label={t.billingAddress}
                placeholder={t.billingAddressPlaceholder}
              />
            </div>

            <div className="mt-6">
              <button
                type="button"
                className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800"
              >
                {t.saveBilling}
              </button>
              <p className="mt-2 text-xs text-slate-500">{t.adminOnly}</p>
            </div>
            <div className="mt-6 border-t border-slate-200 pt-6">
  <h3 className="text-sm font-semibold text-slate-900">Subscription</h3>
  <p className="mt-1 text-sm text-slate-500">
    Manage your subscription or cancel your plan.
  </p>

  <button
  type="button"
  onClick={async () => {
    try {
      await openCustomerPortal();
    } catch (e) {
      console.error(e);
    }
  }}
  className="mt-4 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
>
  Cancel subscription
</button>
</div>

<div className="mt-6 border-t border-red-100 pt-6">
  <h3 className="text-sm font-semibold text-red-700">Danger zone</h3>
  <p className="mt-1 text-sm text-slate-500">
    Permanently delete your account and workspace data.
  </p>

  <button
    type="button"
    className="mt-4 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100"
  >
    Delete account
  </button>
</div>
          </SettingsCard>
        </div>
      </div>
    </div>
  );
}