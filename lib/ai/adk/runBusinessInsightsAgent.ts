
import "server-only";
import { GOOGLE_SEARCH, LlmAgent } from "@google/adk";
import type { DashboardInsightInput } from "@/lib/ai/generateDashboardInsight";
import { getHistoricalSyncSummaries } from "@/lib/firestore/getHistoricalSyncSummaries";
import { InMemoryRunner } from "@google/adk";
import { businessInsightsAgent } from "./businessInsightsAgent";

export async function runBusinessInsightsAgent(
  snapshot: DashboardInsightInput,
  workspaceId: string,
): Promise<string> {
  const runner = new InMemoryRunner({
    agent: businessInsightsAgent,
    appName: "ser3bellum",
  });

  const historicalSummaries = await getHistoricalSyncSummaries(
  workspaceId,
  7,
);

  const newMessage = {
    role: "user",
    parts: [
      {
        text: `Analyze this Ser3bellum business snapshot:

${JSON.stringify(snapshot, null, 2)}
Historical business summaries from the same workspace:
${JSON.stringify(historicalSummaries, null, 2)}

Apply the eight-stage analytical methodology defined
in your instructions.

Evaluate business performance and operational evidence,
validate comparisons, investigate relevant relationships,
consider plausible explanations, and recommend the most
appropriate next action.

Consider both business analytics and web operations.
Investigate relationships between operational conditions
and business performance when supported by evidence.

Use only the supplied current snapshot and historical
business summaries as evidence of this customer's
actual business and operational performance.

Use historical evidence to identify recurring issues,
meaningful changes, and relevant trends.

Compare periods only when their dates, metrics, units,
and data sources are compatible.

Do not treat multiple sync summaries as separate
calendar days.

Distinguish verified observations from hypotheses.
Do not infer operational incidents or business losses
without supporting evidence.

If historical evidence is insufficient, acknowledge
that limitation.

Identify ONE meaningful finding.
Return the required JSON object.`,
      },
    ],
  };

  let response = "";

  console.log("[ADK] Business Insights Agent started");

 for await (const event of runner.runEphemeral({
  userId: "ser3bellum_business_analysis",
  newMessage,
})) {
  if (event.groundingMetadata) {
    console.log("[ADK] Grounding metadata received", {
      chunks: event.groundingMetadata.groundingChunks?.length ?? 0,
      supports: event.groundingMetadata.groundingSupports?.length ?? 0,
    });
  }

  if (!event.content || event.content.role !== "model") continue;

  response = (event.content.parts ?? [])
    .map((part) => ("text" in part ? part.text ?? "" : ""))
    .join("");
}

  if (!response.trim()) {
    throw new Error("Business Insights Agent returned no response.");
  }

  return response;
}
