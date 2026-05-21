"use client";

import Link from "next/link";
import { sendEmailVerification } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/clients";

export default function PaymentSuccessPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  async function sendVerification() {
    const user = auth.currentUser;

    if (!user) {
      setStatus("error");
      setMessage("Please log in first, then request a verification email.");
      return;
    }

    if (user.emailVerified) {
      setStatus("sent");
      setMessage("Your email is already verified.");
      return;
    }

    setStatus("sending");

    try {
      await sendEmailVerification(user, {
        url: `${window.location.origin}/login`,
      });

      setStatus("sent");
      setMessage("Verification email sent. Please check your inbox.");
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message ?? "Could not send verification email.");
    }
  }

  useEffect(() => {
    void sendVerification();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white/80 p-10 text-center shadow-sm backdrop-blur">
        <div className="mb-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <span className="text-3xl">✓</span>
          </div>
        </div>

        <h1 className="text-3xl font-semibold text-slate-900">
          Workspace activated
        </h1>

        <p className="mt-4 text-sm leading-6 text-slate-600">
          Your subscription is now active.
          <br />
          Please verify your email address to secure your workspace.
        </p>

        {message && (
          <p
            className={`mt-5 rounded-xl px-4 py-3 text-sm ${
              status === "error"
                ? "bg-rose-50 text-rose-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {message}
          </p>
        )}

        <div className="mt-8 space-y-3">
          <Link
            href="/login"
            className="flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Go to login
          </Link>

          <button
            type="button"
            onClick={sendVerification}
            disabled={status === "sending"}
            className="flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "sending"
              ? "Sending..."
              : "Resend verification email"}
          </button>
        </div>

        <p className="mt-6 text-xs text-slate-400">
          If you don’t see the email, check your spam folder.
        </p>
      </div>
    </main>
  );
}