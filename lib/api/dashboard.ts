import type { DashboardResponse } from "@/lib/contracts/dasboard";

export async function fetchDashboard(from: string, to: string): Promise<DashboardResponse> {
  const res = await fetch(`/api/dashboard?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, {
    method: "GET",
  });
  if (!res.ok) throw new Error("Failed to load dashboard");
  return res.json();
}