import { generateGeminiDashboardInsight } from "@/lib/ai/generateGeminiDashboardInsight";

async function test() {
  const input = {
    sales: {
      revenue: 129,
      orderCount: 3,
    },
    analytics: {
      sessions: 0,
    },
    marketing: {
      traffic: 1800,
      delta: "+12.3%",
    },
    downtime: {
      minutes: 12,
    },
    cpu: {
      usage: 68,
    },
  };

  const result = await generateGeminiDashboardInsight(input);
  console.log(JSON.stringify(result, null, 2));
}

test().catch((error) => {
  console.error("Gemini test failed:");
  console.error(error);
});