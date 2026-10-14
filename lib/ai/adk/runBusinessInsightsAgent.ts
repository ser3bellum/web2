
import "server-only";

import type { DashboardInsightInput } from "@/lib/ai/generateDashboardInsight";
import { InMemoryRunner } from "@google/adk";
import { businessInsightsAgent } from "./businessInsightsAgent";

export async function runBusinessInsightsAgent(
  snapshot: DashboardInsightInput,
): Promise<string> {
  const runner = new InMemoryRunner({
    agent: businessInsightsAgent,
    appName: "ser3bellum",
  });

  const newMessage = {
    role: "user",
    parts: [
      {
        text: `Analyze this Ser3bellum business snapshot:

${JSON.stringify(snapshot, null, 2)}

Identify the most important observation and recommend
a practical next action.`,
      },
    ],
  };

  let response = "";

  for await (const event of runner.runEphemeral({
    userId: "ser3bellum_business_analysis",
    newMessage,
  })) {
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
