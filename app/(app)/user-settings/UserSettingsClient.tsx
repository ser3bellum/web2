"use client";

import {
	EmailAuthProvider,
	reauthenticateWithCredential,
	updatePassword,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { auth } from "@/lib/firebase/clients"; // adjust path to your actual client auth export
import FieldRow from "./components/FieldRow";
import SettingsCard from "./components/SettingsCard";

/**
 * API helpers
 */
async function saveProfile(payload: { name?: string; jobTitle?: string }) {
	const res = await fetch("/api/user/update", {
		method: "POST",
		headers: { "content-type": "application/json" },
		credentials: "include",
		body: JSON.stringify(payload),
	});

	const data = await res.json().catch(() => ({}));

	if (!res.ok) throw new Error(data?.error || data?.message || "Save failed");

	return data as {
		ok: boolean;
		user?: {
			name?: string;
			jobTitle?: string;
			avatarUrl?: string | null;
		} | null;
	};
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
	if (!res.ok) throw new Error(data.error || "Save failed");
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
	console.log("avatar raw response:", res.status, raw);

	let data: any = {};
	try {
		data = raw ? JSON.parse(raw) : {};
	} catch {
		data = { raw };
	}

	// ✅ only throw on error (your version threw every time)
	if (!res.ok) {
		throw new Error(
			data?.error || data?.message || `Upload failed (${res.status})`,
		);
	}

	return data as { ok: boolean; avatarUrl: string };
}

/**
 * Props
 */
type Props = {
	user: {
		id: string;
		email: string;
		name: string;

		// ✅ “Role” is stored as jobTitle
		jobTitle?: string;

		// ✅ avatar support
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
};
console.log("auth.currentUser:", auth.currentUser);
export default function UserSettingsClient({ user, company }: Props) {
	const router = useRouter();
	console.log("Settings user prop:", user);
	console.log("Settings user.jobTitle:", user?.jobTitle);

	/**
	 * Avatar state
	 */
	const fileRef = useRef<HTMLInputElement | null>(null);
	const [avatarPreview, setAvatarPreview] = useState<string>("");
	const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
	const [avatarUrl, setAvatarUrl] = useState<string | null>(
		user.avatarUrl ?? null,
	);

	/**
	 * Profile state
	 */
	const [profileName, setProfileName] = useState(user.name ?? "");
	const [role, setRole] = useState(user.jobTitle ?? "");
	const [isSavingProfile, setIsSavingProfile] = useState(false);
	const [profileSaved, setProfileSaved] = useState(false);
	const [authority, setAuthority] = useState("Admin");

	const profileDirty =
		profileName !== (user?.name ?? "") || role !== (user?.jobTitle ?? "");

	/**
	 * Password state
	 */
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const [isSavingPassword, setIsSavingPassword] = useState(false);
	const [passwordSaved, setPasswordSaved] = useState(false);
	const [passwordError, setPasswordError] = useState<string | null>(null);

	const passwordDirty =
		currentPassword.length > 0 ||
		newPassword.length > 0 ||
		confirmPassword.length > 0;
	const passwordsMatch = newPassword === confirmPassword;
	const passwordValid = newPassword.length >= 8; // basic; Firebase also enforces
	/**
	 * Company state
	 */
	const [companyName, setCompanyName] = useState(company.name);
	const [companyWebsite, setCompanyWebsite] = useState(company.website);
	const [companySize, setCompanySize] = useState(company.companySize);
	const [companyActivity, setCompanyActivity] = useState(company.activity);

	const [isSavingCompany, setIsSavingCompany] = useState(false);
	const [companySaved, setCompanySaved] = useState(false);

	const emailLabel = useMemo(() => user.email || "—", [user.email]);

	// Keep form state in sync if server props revalidate (router.refresh, logout/login, etc.)
	useEffect(() => {
		setCompanyName(company.name ?? "");
		setCompanyWebsite(company.website ?? "");
		setCompanySize(company.companySize ?? "");
		setCompanyActivity(company.activity ?? "");
	}, [company.name, company.website, company.companySize, company.activity]);

	useEffect(() => {
		setProfileName(user?.name ?? "");
		setRole(user?.jobTitle ?? "");
		setAvatarUrl(user?.avatarUrl ?? null);
	}, [user?.name, user?.jobTitle, user?.avatarUrl]);

	return (
		<div className="px-6 py-6">
			{/* Header */}
			<div className="mb-8 flex items-start justify-between gap-4">
				{/* User chip */}
				<div className="flex items-center gap-4">
					<div className="h-12 w-12 overflow-hidden rounded-full bg-slate-200">
						{/* optional: small header avatar */}
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
				<button type="button"
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
						{/* Avatar uploader */}
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

										// quick validation (client-side)
										if (!f.type.startsWith("image/")) {
											console.error("Not an image");
											return;
										}

										// instant preview
										setAvatarPreview(URL.createObjectURL(f));
										setIsUploadingAvatar(true);

										try {
											const data = await uploadAvatar(f);
											setAvatarUrl(data.avatarUrl);
											setAvatarPreview(""); // switch to stored URL
											router.refresh(); // ✅ updates sidebar / header
										} catch (err) {
											console.error(err);
											// TODO: toast
											// revert preview on error
											setAvatarPreview("");
										} finally {
											setIsUploadingAvatar(false);
											// reset input value so same file can be chosen again
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
									{isUploadingAvatar ? "Uploading…" : "Change"}
								</button>

								<button
									type="button"
									onClick={() => {
										// MVP: local clear only
										setAvatarPreview("");
										setAvatarUrl(null);
										// later: call /api/user/avatar/remove to clear DB + delete storage object
										router.refresh();
									}}
									className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
								>
									Remove
								</button>
							</div>
						</div>

						<div className="mt-6 grid gap-4">
							<FieldRow
								label="Username"
								value={profileName}
								placeholder="Your name"
								onChange={setProfileName}
							/>
							<FieldRow label="Email" value={user.email} disabled />
							<FieldRow
								label="Role"
								value={role}
								placeholder="CTO"
								onChange={setRole}
							/>
							<FieldRow
								label="Authority"
								select
								options={["Admin", "Editor", "Viewer"]}
								value={authority}
								placeholder="Admin"
								onChange={setAuthority}
							/>
						</div>

						<div className="mt-6">
							<button type="button"
								disabled={isSavingProfile || !profileDirty}
								onClick={async () => {
									setIsSavingProfile(true);
									setProfileSaved(false);

									try {
										const data = await saveProfile({
											name: profileName,
											jobTitle: role,
										});

										// update UI with server truth
										if (data?.user?.name !== undefined) {
											setProfileName(data.user.name ?? "");
										}
										if (data?.user?.jobTitle !== undefined) {
											setRole(data.user.jobTitle ?? "");
										}

										setProfileSaved(true);
										setTimeout(() => setProfileSaved(false), 1500);

										router.refresh();
									} catch (e: any) {
										console.error(e);
										// TODO: toast e.message
									} finally {
										setIsSavingProfile(false);
									}
								}}
								className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
							>
								{isSavingProfile
									? "Saving…"
									: profileSaved
										? "Saved ✓"
										: "Save profile"}
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
							<button type="button" className="w-full rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800">
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
								value={currentPassword}
								onChange={setCurrentPassword}
							/>
							<FieldRow
								label="New Password"
								placeholder="••••••••"
								type="password"
								value={newPassword}
								onChange={setNewPassword}
							/>
							<div className="md:col-span-2">
								<FieldRow
									label="Confirm New Password"
									placeholder="••••••••"
									type="password"
									value={confirmPassword}
									onChange={setConfirmPassword}
								/>
							</div>
						</div>

						<div className="mt-6">
							<button type="button"
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
											throw new Error("Not authenticated in browser.");
										}

										// 1) Re-authenticate with current password
										const cred = EmailAuthProvider.credential(
											userAuth.email,
											currentPassword,
										);
										await reauthenticateWithCredential(userAuth, cred);

										// 2) Update password
										await updatePassword(userAuth, newPassword);

										// 3) UI feedback + cleanup
										setPasswordSaved(true);
										setCurrentPassword("");
										setNewPassword("");
										setConfirmPassword("");
										setTimeout(() => setPasswordSaved(false), 1500);
									} catch (e: any) {
										console.error(e);

										// Friendly-ish mapping
										const code = e?.code as string | undefined;
										if (
											code === "auth/wrong-password" ||
											code === "auth/invalid-credential"
										) {
											setPasswordError("Current password is incorrect.");
										} else if (code === "auth/weak-password") {
											setPasswordError(
												"New password is too weak. Try at least 8 characters.",
											);
										} else if (code === "auth/requires-recent-login") {
											setPasswordError(
												"Please log in again, then try changing your password.",
											);
										} else {
											setPasswordError(e?.message || "Password update failed.");
										}
									} finally {
										setIsSavingPassword(false);
									}
								}}
								className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
							>
								{isSavingPassword
									? "Updating…"
									: passwordSaved
										? "Updated ✓"
										: "Update Password"}
								{!passwordsMatch && confirmPassword.length > 0 ? (
									<p className="mt-2 text-xs text-red-600">
										Passwords do not match.
									</p>
								) : null}

								{passwordError ? (
									<p className="mt-2 text-xs text-red-600">{passwordError}</p>
								) : null}
							</button>
						</div>
					</SettingsCard>

					<SettingsCard
						title="Company Infos"
						subtitle="Manage your company's information."
					>
						<div className="grid gap-4 md:grid-cols-2">
							<FieldRow
								label="Company Name"
								value={companyName}
								placeholder="Company name"
								onChange={setCompanyName}
							/>
							<FieldRow
								label="Company Website"
								value={companyWebsite}
								placeholder="https://example.com"
								onChange={setCompanyWebsite}
							/>
							<FieldRow
								label="Number of Employees"
								placeholder="Select a size"
								select
								options={["1–10", "11–50", "51–200", "201–1000", "1000+"]}
								value={companySize}
								onChange={setCompanySize}
							/>
							<FieldRow
								label="Type of Activity"
								value={companyActivity}
								placeholder="Technology"
								onChange={setCompanyActivity}
							/>
						</div>

						<div className="mt-6">
							<button type="button"
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

										// ✅ Update local UI with server truth
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
									} catch (e: any) {
										console.error(e);
										// TODO: toast e.message
									} finally {
										setIsSavingCompany(false);
									}
								}}
								className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
							>
								{isSavingCompany
									? "Saving…"
									: companySaved
										? "Saved ✓"
										: "Save company"}
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
							<button type="button" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">
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
							<button type="button" className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800">
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
