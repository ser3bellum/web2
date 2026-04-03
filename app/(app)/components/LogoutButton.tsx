"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type LogoutButtonProps = {
  label: string;
  loadingLabel: string;
};

export function LogoutButton({
  label,
  loadingLabel,
}: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    try {
      setLoading(true);
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setLoading(false);
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <button
      onClick={onLogout}
      disabled={loading}
      className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      type="button"
    >
      {loading ? loadingLabel : label}
    </button>
  );
}
