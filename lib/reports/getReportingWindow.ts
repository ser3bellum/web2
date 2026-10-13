
import "server-only";

export type ReportingWindow = {
  from: string;
  to: string;
  nextReportAt: Date;
  isDue: boolean;
};

export function getReportingWindow(
  createdAt: Date,
  now: Date = new Date(),
): ReportingWindow {
  if (
    Number.isNaN(createdAt.getTime()) ||
    Number.isNaN(now.getTime())
  ) {
    throw new Error("Invalid reporting date.");
  }

  const anniversary = new Date(now);

  anniversary.setUTCHours(
    createdAt.getUTCHours(),
    createdAt.getUTCMinutes(),
    createdAt.getUTCSeconds(),
    createdAt.getUTCMilliseconds(),
  );

  // Most recent reporting anniversary.
  if (anniversary.getTime() > now.getTime()) {
    anniversary.setUTCDate(anniversary.getUTCDate() - 1);
  }

  const firstReportAt = new Date(
    createdAt.getTime() + 86_400_000,
  );

  const isDue =
    now.getTime() >= firstReportAt.getTime() &&
    anniversary.getTime() >= firstReportAt.getTime();

  const nextReportAt = new Date(anniversary);
  nextReportAt.setUTCDate(nextReportAt.getUTCDate() + 1);

  // Use the latest completed UTC calendar day.
  const lastCompletedDay = new Date(anniversary);
  lastCompletedDay.setUTCHours(0, 0, 0, 0);
  lastCompletedDay.setUTCDate(lastCompletedDay.getUTCDate() - 1);

  const reportDate = lastCompletedDay
    .toISOString()
    .slice(0, 10);

  return {
    from: reportDate,
    to: reportDate,
    nextReportAt,
    isDue,
  };
}
