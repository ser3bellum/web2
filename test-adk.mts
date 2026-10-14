

import { InMemoryRunner, LlmAgent } from "@google/adk";


const agent = new LlmAgent({
  name: "ser3bellum_test",
  model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  instruction:
    "You are a business analyst. Analyze only the supplied data. Never invent facts.",
});

const runner = new InMemoryRunner({
  agent,
  appName: "ser3bellum_test",
});

const snapshot = {
  dateWindow: {
    from: "2026-10-01",
    to: "2026-10-07",
  },
  businessSources: [
    {
      category: "analytics",
      provider: "google-analytics",
      status: "ok",
      metrics: { sessions: 120 },
    },
    {
      category: "sales",
      provider: "shopify",
      status: "ok",
      metrics: {
        revenue: 850,
        orderCount: 12,
        currency: "EUR",
      },
    },
  ],
};

for await (const event of runner.runEphemeral({
  userId: "local_test",
  newMessage: {
    role: "user",
    parts: [
      {
        text: `Analyze this business snapshot and suggest one actionable next step:\n${JSON.stringify(snapshot)}`,
      },
    ],
  },
})) {
  if (event.content?.role !== "model") continue;

  for (const part of event.content.parts ?? []) {
    if ("text" in part && part.text) {
      console.log(part.text);
    }
  }
}
