"use client";

import { Calendar, Sparkles } from "lucide-react";

type TrialBannerProps = {
  billingStatus?: string;
  trialEnd?: string | Date | null;
  cancelAtPeriodEnd?: boolean;
};

export function TrialBanner({
  billingStatus,
  trialEnd,
  cancelAtPeriodEnd,
}: TrialBannerProps) {
  if (billingStatus !== "trialing") {
    return null;
  }

  const end =
    trialEnd instanceof Date
      ? trialEnd
      : trialEnd
      ? new Date(trialEnd)
      : null;

  const daysLeft = end
    ? Math.max(
        0,
        Math.ceil(
          (end.getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : null;

  return (
    <div className="mb-6 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5">

      <div className="flex items-start gap-3">

        <Sparkles className="h-5 w-5 text-blue-600" />

        <div className="flex-1">

          <h3 className="font-semibold">
            Free Trial Active
          </h3>

          <p className="text-sm text-muted-foreground">

            {cancelAtPeriodEnd
              ? `Your trial ends in ${daysLeft} days. Access will stop automatically.`
              : `You have ${daysLeft} days remaining in your free trial.`}

          </p>

        </div>

        <Calendar className="h-5 w-5" />

      </div>

    </div>
  );
}