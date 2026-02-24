"use client";

import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { auth } from "@/lib/firebase/clients";

export default function LoginForm() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setLoading(true);

		const form = new FormData(e.currentTarget);
		const email = String(form.get("email") || "").trim();
		const password = String(form.get("password") || "");

		try {
			const cred = await signInWithEmailAndPassword(auth, email, password);
			const idToken = await cred.user.getIdToken();

			const res = await fetch("/api/auth/session", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ idToken }),
			});

			if (!res.ok) throw new Error("Session creation failed");

			router.push("/dashboard");
		} catch (err: any) {
			setError(err?.message ?? "Login failed");
		} finally {
			setLoading(false);
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
						className="text-sm text-blue-600 hover:underline"
						onClick={() => alert("Forgot password (later)")}
					>
						Forgot password?
					</button>
				</div>

				{error && <p className="text-sm text-red-600">{error}</p>}

				<button
					type="submit"
					disabled={loading}
					className="mt-2 h-11 w-full rounded-lg bg-blue-600 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
				>
					{loading ? "Signing in..." : "Continue"}
				</button>
			</form>
		</>
	);
}
