"use client";

import {
	sendPasswordResetEmail,
	signInWithEmailAndPassword,
} from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { auth } from "@/lib/firebase/clients";

export default function LoginForm() {
	const router = useRouter();

	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [resetLoading, setResetLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setMessage(null);
		setLoading(true);

		const form = new FormData(e.currentTarget);
		const emailValue = String(form.get("email") || "").trim();
		const password = String(form.get("password") || "");

		try {
			const cred = await signInWithEmailAndPassword(auth, emailValue, password);
			const idToken = await cred.user.getIdToken();

			const res = await fetch("/api/auth/session", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ idToken }),
			});

			if (!res.ok) throw new Error("Session creation failed");

			router.push("/dashboard");
		} catch (err: any) {
			switch (err?.code) {
				case "auth/invalid-credential":
				case "auth/wrong-password":
				case "auth/user-not-found":
					setError("Invalid email or password.");
					break;
				case "auth/too-many-requests":
					setError("Too many attempts. Please try again later.");
					break;
				default:
					setError(err?.message ?? "Login failed");
			}
		} finally {
			setLoading(false);
		}
	}

	async function onForgotPassword() {
	setError(null);
	setMessage(null);

	const trimmedEmail = email.trim();

	if (!trimmedEmail) {
		setError("Please enter your email address first.");
		return;
	}

	try {
		setResetLoading(true);

		await sendPasswordResetEmail(auth, trimmedEmail, {
			url: "https://app.ser3bellum.com/reset-password",
			handleCodeInApp: false,
		});

		setMessage(
			"If an account exists for this email, a reset link has been sent."
		);
	} catch (err: any) {
		switch (err?.code) {
			case "auth/invalid-email":
				setError("Please enter a valid email address.");
				break;
			default:
				setError("Unable to send password reset email.");
		}
	} finally {
		setResetLoading(false);
	}
}

	return (
		<>
			<h1 className="text-xl font-semibold text-slate-900">Login</h1>

			<p className="mt-1 text-sm text-slate-500">
				Enter your credentials to continue
			</p>

			<form onSubmit={onSubmit} className="mt-6 space-y-4">
				<div>
					<label
						htmlFor="email"
						className="mb-1 block text-sm font-medium text-slate-700"
					>
						Email
					</label>
					<input
						id="email"
						name="email"
						type="email"
						placeholder="you@company.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
						autoComplete="email"
						required
					/>
				</div>

				<div>
					<label
						htmlFor="password"
						className="mb-1 block text-sm font-medium text-slate-700"
					>
						Password
					</label>
					<input
						id="password"
						name="password"
						type="password"
						placeholder="••••••••"
						className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
						autoComplete="current-password"
						required
					/>
				</div>

				<div className="-mt-2 flex justify-end">
					<button
						type="button"
						className="text-sm text-blue-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
						onClick={onForgotPassword}
						disabled={resetLoading}
					>
						{resetLoading ? "Sending..." : "Forgot password?"}
					</button>
				</div>

				{error && <p className="text-sm text-red-600">{error}</p>}
				{message && <p className="text-sm text-green-600">{message}</p>}

				<button
					type="submit"
					disabled={loading}
					className="mt-2 h-11 w-full rounded-lg bg-blue-600 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{loading ? "Signing in..." : "Continue"}
				</button>

				<p className="text-center text-sm text-slate-500">
					Don&apos;t have an account?{" "}
					<Link
						href="/register"
						className="font-medium text-blue-600 hover:underline"
					>
						Register
					</Link>
				</p>
			</form>
		</>
	);
}