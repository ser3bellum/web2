import type * as React from "react";
import { Sparkles } from "lucide-react";
import type { AIInsightStatus } from "@/types/ai";

type AIInsightsCardProps = React.HTMLAttributes<HTMLDivElement> & {
  status?: AIInsightStatus;
  title?: string;
  headline?: string;
  whyItMatters?: string;
  recommendedAction?: string;
  sourceNote?: string;
};

export function AIInsightsCard({
  status = "ready",
  title = "AI Insights",
  headline = "Your uptime dropped on Connector X after 09:20.",
  whyItMatters = "A sudden degradation was detected across monitoring signals during the selected period.",
  recommendedAction = "Review the latest failed checks and compare them with recent deployment or config changes.",
  sourceNote = "Based on uptime logs, failed checks, and API latency.",
  className = "",
  ...props
}: AIInsightsCardProps) {
  const isEmpty = status === "empty";
  const isError = status === "error";
  const isLoading = status === "loading";
  const isReady = status === "ready";

  return (
    <section
      className={[
        "relative h-[408px] overflow-hidden rounded-2xl",
        "shadow-[0_8px_24px_rgba(0,0,0,0.08)] ring-1 ring-black/5",
        "text-white",
        className,
      ].join(" ")}
      style={{
        background:
          "linear-gradient(135deg, #d9e4ff 0%, #d2c7f3 52%, #d8b9ec 100%)",
      }}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-white/[0.05]" />
      </div>

      <div className="relative flex h-full flex-col p-7">
        <div className="mb-6 flex shrink-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/18 ring-1 ring-white/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <h3 className="text-[1.125rem] font-semibold tracking-[-0.02em] text-white/95">
            {title}
          </h3>
        </div>

        <div
          className={[
            "ai-insights-scroll relative min-h-0 flex-1 overflow-y-auto pr-3",
          ].join(" ")}
        >
          {isLoading ? (
            <div className="space-y-5 pb-10">
              <div>
                <div className="mb-3 h-3 w-32 rounded bg-white/18" />
                <div className="h-6 w-[68%] animate-pulse rounded bg-white/24" />
              </div>
              <div>
                <div className="mb-3 h-3 w-36 rounded bg-white/18" />
                <div className="h-4 w-[85%] animate-pulse rounded bg-white/20" />
                <div className="mt-2 h-4 w-[64%] animate-pulse rounded bg-white/20" />
              </div>
              <div>
                <div className="mb-3 h-3 w-40 rounded bg-white/18" />
                <div className="h-4 w-[78%] animate-pulse rounded bg-white/20" />
                <div className="mt-2 h-4 w-[58%] animate-pulse rounded bg-white/20" />
              </div>
            </div>
          ) : isEmpty ? (
            <div className="space-y-4 pb-10">
              <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/75">
                No insight yet
              </h4>
              <p className="max-w-2xl text-[1.05rem] font-semibold leading-snug text-white">
                AI Insights will appear once enough connector activity is available.
              </p>
              <p className="max-w-2xl text-sm leading-7 text-white/88">
                Connect more sources or wait for fresh events so the system can generate a meaningful summary.
              </p>
            </div>
          ) : isError ? (
            <div className="space-y-4 pb-10">
              <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/75">
                Insight unavailable
              </h4>
              <p className="max-w-2xl text-[1.05rem] font-semibold leading-snug text-white">
                We could not generate an AI insight right now.
              </p>
              <p className="max-w-2xl text-sm leading-7 text-white/88">
                Please retry in a moment or check whether your connected sources are returning fresh data.
              </p>
            </div>
          ) : (
            <div className="space-y-5 pb-12">
              <section>
                <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/75">
                  Headline insight
                </h4>
                <p className="mt-3 max-w-3xl text-[1.05rem] font-semibold leading-snug text-white">
                  {headline}
                </p>
              </section>

              <section>
                <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/75">
                  Why this matters
                </h4>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/90">
                  {whyItMatters}
                </p>
              </section>

              <section>
                <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/75">
                  Recommended action
                </h4>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/92">
                  {recommendedAction}
                </p>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/72">
                  {sourceNote}
                </p>
              </section>
            </div>
          )}

          {isReady && (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[8%] min-h-[30px]"
              style={{
                background:
                  "linear-gradient(to top, rgba(216,185,236,0.55) 0%, rgba(216,185,236,0.28) 45%, rgba(216,185,236,0) 100%)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            />
          )}
        </div>
      </div>
    </section>
  );
}