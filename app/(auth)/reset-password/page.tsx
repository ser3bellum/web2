"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
	confirmPasswordReset,
	verifyPasswordResetCode,
} from "firebase/auth";
import { auth } from "@/lib/firebase/clients";

type Status =
	| "checking"
	| "ready"
	| "submitting"
	| "success"
	| "invalid";

export default function ResetPasswordPage() {
	const searchParams = useSearchParams();

	const oobCode = useMemo(() => searchParams.get("oobCode") || "", [searchParams]);
	const mode = useMemo(() => searchParams.get("mode") || "", [searchParams]);

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [status, setStatus] = useState<Status>("checking");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		async function validateCode() {
			if (mode !== "resetPassword" || !oobCode) {
				if (!cancelled) {
					setStatus("invalid");
					setError("This password reset link is invalid.");
				}
				return;
			}

			try {
				const resolvedEmail = await verifyPasswordResetCode(auth, oobCode);

				if (!cancelled) {
					setEmail(resolvedEmail);
					setStatus("ready");
					setError(null);
				}
			} catch {
				if (!cancelled) {
					setStatus("invalid");
					setError("This password reset link is invalid or has expired.");
				}
			}
		}

		void validateCode();

		return () => {
			cancelled = true;
		};
	}, [mode, oobCode]);

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		if (password.length < 8) {
			setError("Your new password must be at least 8 characters long.");
			return;
		}

		if (password !== confirmPassword) {
			setError("Passwords do not match.");
			return;
		}

		try {
			setStatus("submitting");
			setError(null);

			await confirmPasswordReset(auth, oobCode, password);

			setStatus("success");
		} catch {
			setStatus("invalid");
			setError("Unable to reset password. This link may have expired or already been used.");
		}
	}

	return (
		<div className="w-full">
			<h1 className="text-xl font-semibold text-slate-900">Reset password</h1>

			<p className="mt-1 text-sm text-slate-500">
				Choose a new password for your account.
			</p>

			{status === "checking" && (
				<div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
					Verifying your reset link...
				</div>
			)}

			{status === "invalid" && (
				<div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
					<p className="text-sm text-red-700">
						{error ?? "This password reset link is invalid or has expired."}
					</p>

					<div className="mt-4">
						<Link
							href="/login"
							className="text-sm font-medium text-blue-600 hover:underline"
						>
							Back to login
						</Link>
					</div>
				</div>
			)}

			{status === "ready" || status === "submitting" ? (
				<form onSubmit={onSubmit} className="mt-6 space-y-4">
					<div>
						<label className="mb-1 block text-sm font-medium text-slate-700">
							Email
						</label>
						<input
							type="email"
							value={email}
							readOnly
							className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 outline-none"
						/>
					</div>

					<div>
						<label
							htmlFor="password"
							className="mb-1 block text-sm font-medium text-slate-700"
						>
							New password
						</label>
						<input
							id="password"
							name="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Enter your new password"
							className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
							autoComplete="new-password"
							required
						/>
					</div>

					<div>
						<label
							htmlFor="confirmPassword"
							className="mb-1 block text-sm font-medium text-slate-700"
						>
							Confirm new password
						</label>
						<input
							id="confirmPassword"
							name="confirmPassword"
							type="password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							placeholder="Re-enter your new password"
							className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
							autoComplete="new-password"
							required
						/>
					</div>

					{error && <p className="text-sm text-red-600">{error}</p>}

					<button
						type="submit"
						disabled={status === "submitting"}
						className="h-11 w-full rounded-lg bg-blue-600 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{status === "submitting" ? "Updating password..." : "Update password"}
					</button>

					<p className="text-center text-sm text-slate-500">
						<Link
							href="/login"
							className="font-medium text-blue-600 hover:underline"
						>
							Back to login
						</Link>
					</p>
				</form>
			) : null}

			{status === "success" && (
				<div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
					<p className="text-sm text-green-700">
						Your password has been updated successfully.
					</p>

					<div className="mt-4">
						<Link
							href="/login"
							className="text-sm font-medium text-blue-600 hover:underline"
						>
							Return to login
						</Link>
					</div>
				</div>
			)}
		</div>
	);
}