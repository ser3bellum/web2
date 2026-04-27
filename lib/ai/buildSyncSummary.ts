

type HydrationCard = {
  key: string;
  title: string;
  status: "ok" | "warn" | "error" | "disabled";
  value: string;
  delta?: string;
  meta?: Record<string, any>;
};

type ConnectorSummaryStatus = "connected" | "degraded" | "disconnected";

type ConnectorStatusMap = Record<
  string,
  {
    status: ConnectorSummaryStatus;
    lastSyncAt?: string | null;
    note?: string | null;
  }
>;

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function buildSyncSummaryFromHydrationCards(args: {
  workspaceId: string;
  syncSource: "manual_refresh" | "scheduled" | "login_refresh";
  hydrationCards: HydrationCard[];
  dateWindow: { from: string; to: string };
}) {
  const { workspaceId, syncSource, hydrationCards, dateWindow } = args;

  const sales = hydrationCards.find((x) => x.key === "sales");
  const analytics = hydrationCards.find((x) => x.key === "ga_overview");
  const downtime = hydrationCards.find((x) => x.key === "downtime");
  const cpu = hydrationCards.find((x) => x.key === "cpu");
  const marketing = hydrationCards.find((x) => x.key === "marketing");

  const connectorStatusEntries: Array<
    [
      string,
      {
        status: ConnectorSummaryStatus;
        lastSyncAt?: string | null;
        note?: string | null;
      }
    ]
  > = hydrationCards.map((card) => {
    const status: ConnectorSummaryStatus =
      card.status === "ok"
        ? "connected"
        : card.status === "warn" || card.status === "error"
          ? "degraded"
          : "disconnected";

    return [
      card.key,
      {
        status,
        lastSyncAt: null,
        note: card.delta ?? null,
      },
    ];
  });

  const connectorStatus: ConnectorStatusMap =
    Object.fromEntries(connectorStatusEntries);

  return {
    workspaceId,
    syncSource,
    connectorIds: hydrationCards.map((x) => x.key),
    dateWindow,
    signals: {
      sales: sales
        ? {
            revenue: toNumber(
              sales.meta?.currentRevenue ?? sales.meta?.revenue ?? sales.meta?.amount
            ),
            orderCount: toNumber(sales.meta?.orderCount),
            currency:
              typeof sales.meta?.currency === "string"
                ? sales.meta.currency.toUpperCase()
                : null,
          }
        : undefined,
      analytics: analytics
        ? {
            sessions: toNumber(analytics.meta?.sessions ?? analytics.meta?.users),
          }
        : undefined,
      marketing: marketing
        ? {
            traffic: toNumber(marketing.meta?.traffic ?? marketing.meta?.visits),
            delta: typeof marketing.delta === "string" ? marketing.delta : null,
          }
        : undefined,
      downtime: downtime
        ? {
            minutes: toNumber(
              downtime.meta?.minutes ?? downtime.meta?.downtimeMinutes
            ),
          }
        : undefined,
      cpu: cpu
        ? {
            usage: toNumber(cpu.meta?.usage ?? cpu.meta?.cpu),
          }
        : undefined,
    },
    connectorStatus,
  };
}