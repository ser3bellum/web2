export type DashboardRange = {
	from: Date;
	to: Date;
};

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseISODate(value: string): Date | null {
	const match = DATE_ONLY_PATTERN.exec(value);
	if (!match) return null;

	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);

	const date = new Date(Date.UTC(year, month - 1, day));

	// Reject impossible dates such as 2026-02-31.
	if (
		date.getUTCFullYear() !== year ||
		date.getUTCMonth() !== month - 1 ||
		date.getUTCDate() !== day
	) {
		return null;
	}

	return date;
}

export function parseDashboardRange(params: {
	from?: string | null;
	to?: string | null;
}): DashboardRange {
	const now = new Date();

	const today = new Date(
		Date.UTC(
			now.getUTCFullYear(),
			now.getUTCMonth(),
			now.getUTCDate(),
		),
	);

	// Default: today plus the previous six days.
	const fallbackFrom = new Date(today);
	fallbackFrom.setUTCDate(fallbackFrom.getUTCDate() - 6);

	const from = params.from ? parseISODate(params.from) : null;
	const to = params.to ? parseISODate(params.to) : null;

	if (!from || !to) {
		return {
			from: fallbackFrom,
			to: today,
		};
	}

	// Guard against a reversed range.
	if (from > to) {
		return {
			from: to,
			to: from,
		};
	}

	return { from, to };
}

export function toISODate(date: Date): string {
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, "0");
	const day = String(date.getUTCDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}