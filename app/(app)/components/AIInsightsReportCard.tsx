import type { AIInsightStatus } from "@/types/ai";
import { Sparkles } from "lucide-react";

type AIInsightsReportCardProps = {
  status?: AIInsightStatus;
  title?: string;
  headline?: string;
  whyItMatters?: string;
  recommendedAction?: string;
  sourceNote?: string;
};

export function AIInsightsReportCard({
  status = "ready",
  title = "AI Insights",
  headline = "",
  whyItMatters = "",
  recommendedAction = "",
  sourceNote = "",
}: AIInsightsReportCardProps) {
  const isLoading = status === "loading";
  const isEmpty = status === "empty";
  const isError = status === "error";

  return (
    <section
      data-report-card="true"
      className="rounded-2xl border border-violet-200 bg-violet-50 p-6 text-slate-900"
    >
      <header className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
          <Sparkles className="h-5 w-5" />
        </div>

        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-0.5 text-xs font-medium uppercase tracking-[0.14em] text-violet-700">
            Intelligent operational summary
          </p>
        </div>
      </header>

      {isLoading ? (
        <div className="rounded-xl border border-violet-100 bg-white p-4 text-sm text-slate-600">
          AI insight is still being prepared.
        </div>
      ) : isEmpty ? (
        <div className="rounded-xl border border-violet-100 bg-white p-4">
          <h4 className="text-sm font-semibold text-slate-900">
            No insight available
          </h4>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            No meaningful AI insight was available for this reporting period.
          </p>
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <h4 className="text-sm font-semibold text-rose-900">
            Insight unavailable
          </h4>
          <p className="mt-2 text-sm leading-6 text-rose-800">
            The AI insight could not be loaded for this report.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
              Headline insight
            </h4>
            <p className="mt-2 text-base font-semibold leading-6 text-slate-950">
              {headline}
            </p>
          </section>

          <section>
            <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
              Why this matters
            </h4>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {whyItMatters}
            </p>
          </section>

          <section>
            <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
              Recommended action
            </h4>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {recommendedAction}
            </p>

            {sourceNote ? (
              <p className="mt-3 text-xs leading-5 text-slate-500">
                {sourceNote}
              </p>
            ) : null}
          </section>
        </div>
      )}
    </section>
  );
}