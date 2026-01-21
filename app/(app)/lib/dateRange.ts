export type DashboardRange = { from: Date; to: Date };

function isValidDate(d: Date) {
  return !Number.isNaN(d.getTime());
}

export function parseDashboardRange(params: {
  from?: string | null;
  to?: string | null;
}): DashboardRange {
  const fromRaw = params.from ?? null;
  const toRaw = params.to ?? null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Default: last 7 days
  const fallbackFrom = new Date(today);
  fallbackFrom.setDate(fallbackFrom.getDate() - 6);

  if (!fromRaw || !toRaw) return { from: fallbackFrom, to: today };

  const from = new Date(fromRaw);
  const to = new Date(toRaw);
  if (!isValidDate(from) || !isValidDate(to)) return { from: fallbackFrom, to: today };

  // Normalise to start of day
  from.setHours(0, 0, 0, 0);
  to.setHours(0, 0, 0, 0);

  // Guard: swap if user somehow sends reversed range
  if (from > to) return { from: to, to: from };

  return { from, to };
}

export function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
