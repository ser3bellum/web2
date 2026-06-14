"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase/clients";

export function SupportForm() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const userId = auth.currentUser?.uid;

    if (!userId) {
      setStatus("error");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/support/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          workspaceId: userId,
          subject,
          message,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to send support request");
      }

      setSubject("");
      setMessage("");
      setStatus("success");
    } catch (error) {
      console.error("SUPPORT_FORM_SUBMIT_FAILED", error);
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="subject"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Subject
        </label>

        <input
          id="subject"
          type="text"
          required
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder="Brief description of your request"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label
          htmlFor="message"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Message
        </label>

        <textarea
          id="message"
          rows={6}
          required
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Describe your issue or question..."
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {status === "success" && (
        <p className="text-sm text-emerald-600">
          Message sent. We'll get back to you as soon as possible.
        </p>
      )}

      {status === "error" && (
        <p className="text-sm text-red-600">
          Something went wrong. Please try again.
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? "Sending..." : "Send Message"}
        </button>
      </div>
    </form>
  );
}