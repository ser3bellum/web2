import { findNangoConnectionId } from "@/lib/nango/findConnectionId";
import { getNango } from "@/lib/nango/server";
import type { DashboardHydration } from "@/types/dashboard";
import {
  INTEGRATION_DEFINITIONS,
  NANGO_INTEGRATION_ID,
  type IntegrationKey,
} from "app/(app)/lib/integrations";

type BusinessCategory =
  | "analytics"
  | "sales"
  | "marketing"
  | "crm"
  | "finance"
  | "socialMedia"
  | "booking"
  | "downtime";

type BusinessSource = {
  category: BusinessCategory;
  provider: string;
  providerConfigKey: string;
  status: CardStatus;
  metrics: Record<string, number | string | null>;
};

type CardStatus = "ok" | "warn" | "error" | "disabled";

type GaSeriesPoint = {
  t: number;
  label: string;
  value: number;
};

type SalesSeriesPoint = {
  t: number;
  label: string;
  value: number;
};

function toYyyyMmDd(input: string | Date) {
  if (typeof input === "string") return input;
  return input.toISOString().slice(0, 10);
}

function parseYyyyMmDd(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
}

function fmtYyyyMmDd(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatDayLabel(ts: number) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(ts);
}

function daysBetweenInclusive(from: string, to: string) {
  const a = parseYyyyMmDd(from);
  const b = parseYyyyMmDd(to);
  const ms = b.getTime() - a.getTime();
  const days = Math.floor(ms / (24 * 60 * 60 * 1000)) + 1;
  return Math.max(days, 1);
}

function previousPeriod(from: string, to: string) {
  const len = daysBetweenInclusive(from, to);
  const fromD = parseYyyyMmDd(from);
  const prevTo = new Date(fromD.getTime() - 24 * 60 * 60 * 1000);
  const prevFrom = new Date(
    prevTo.getTime() - (len - 1) * 24 * 60 * 60 * 1000
  );

  return {
    prevFrom: fmtYyyyMmDd(prevFrom),
    prevTo: fmtYyyyMmDd(prevTo),
  };
}

function formatInt(n: number) {
  return new Intl.NumberFormat("en-GB").format(Math.round(n));
}

function formatCurrency(n: number, currency = "EUR") {
  const safeCurrency =
    typeof currency === "string" && currency.trim().length === 3
      ? currency.toUpperCase()
      : "EUR";

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: safeCurrency,
    maximumFractionDigits: 0,
  }).format(n);
}

function pctDelta(current: number, prev: number) {
  if (!isFinite(prev) || prev <= 0) return undefined;
  const pct = ((current - prev) / prev) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(0)}%`;
}

async function getFirstGa4PropertyId(params: {
  providerConfigKey: string;
  connectionId: string;
}) {
  const nango = getNango();

  const accountsRes = await nango.get({
    endpoint: "/v1beta/accounts",
    params: { pageSize: 1 },
    providerConfigKey: params.providerConfigKey,
    connectionId: params.connectionId,
    baseUrlOverride: "https://analyticsadmin.googleapis.com",
  });

  const accountName: string | undefined = accountsRes?.data?.accounts?.[0]?.name;

  if (!accountName) return undefined;

  const propertiesRes = await nango.get({
    endpoint: "/v1beta/properties",
    params: {
      pageSize: 1,
      filter: `parent:${accountName}`,
    },
    providerConfigKey: params.providerConfigKey,
    connectionId: params.connectionId,
    baseUrlOverride: "https://analyticsadmin.googleapis.com",
  });

  const propName: string | undefined =
    propertiesRes?.data?.properties?.[0]?.name;

  return propName?.split("/")[1];
}

async function runGaReport(params: {
  providerConfigKey: string;
  connectionId: string;
  propertyId: string;
  from: string;
  to: string;
}) {
  const nango = getNango();

  const res = await nango.post({
    endpoint: `/v1beta/properties/${params.propertyId}:runReport`,
    providerConfigKey: params.providerConfigKey,
    connectionId: params.connectionId,
    baseUrlOverride: "https://analyticsdata.googleapis.com",
    data: {
      dateRanges: [{ startDate: params.from, endDate: params.to }],
      metrics: [
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "newUsers" },
        { name: "screenPageViews" },
      ],
    },
  });

  const metricValues = res?.data?.rows?.[0]?.metricValues;
  if (!metricValues) {
    const expected = ["activeUsers", "sessions", "newUsers", "screenPageViews"];
    const headers = res.data?.metricHeaders;
    const emptyRows = res.data?.rows === undefined || (Array.isArray(res.data.rows) && res.data.rows.length === 0);
    // GA4 may omit protobuf default rowCount=0 in a valid empty response.
    if (emptyRows && (res.data?.rowCount === 0 || res.data?.rowCount === undefined) &&
        Array.isArray(headers) && headers.length === expected.length &&
        expected.every((name, index) => headers[index]?.name === name)) {
      return { users: 0, sessions: 0, newUsers: 0, views: 0 };
    }
    throw new Error("Missing GA4 report metrics");
  }
  return {
    users: requiredNumber(metricValues[0]?.value),
    sessions: requiredNumber(metricValues[1]?.value),
    newUsers: requiredNumber(metricValues[2]?.value),
    views: requiredNumber(metricValues[3]?.value),
  };
}

async function runGaDailySeriesReport(params: {
  providerConfigKey: string;
  connectionId: string;
  propertyId: string;
  from: string;
  to: string;
}) {
  const nango = getNango();

  const res = await nango.post({
    endpoint: `/v1beta/properties/${params.propertyId}:runReport`,
    providerConfigKey: params.providerConfigKey,
    connectionId: params.connectionId,
    baseUrlOverride: "https://analyticsdata.googleapis.com",
    data: {
      dateRanges: [{ startDate: params.from, endDate: params.to }],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "screenPageViews" }],
      orderBys: [
        {
          dimension: {
            dimensionName: "date",
          },
        },
      ],
    },
  });

  const rows = Array.isArray(res?.data?.rows) ? res.data.rows : [];
  const valuesByDate = new Map<string, number>();

  for (const row of rows) {
    const dateValue: string | undefined = row?.dimensionValues?.[0]?.value;
    const metricValue: string | undefined = row?.metricValues?.[0]?.value;

    if (!dateValue) continue;
    valuesByDate.set(dateValue, metricValue ? Number(metricValue) : 0);
  }

  const series: GaSeriesPoint[] = [];
  const start = parseYyyyMmDd(params.from);
  const end = parseYyyyMmDd(params.to);

  for (
    let cursor = new Date(start);
    cursor.getTime() <= end.getTime();
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    const yyyy = cursor.getUTCFullYear();
    const mm = String(cursor.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(cursor.getUTCDate()).padStart(2, "0");
    const gaDateKey = `${yyyy}${mm}${dd}`;
    const t = cursor.getTime();

    series.push({
      t,
      label: formatDayLabel(t),
      value: valuesByDate.get(gaDateKey) ?? 0,
    });
  }

  return series;
}

async function getShopifyOrders(params: {
  providerConfigKey: string;
  connectionId: string;
  from: string;
  to: string;
}) {
  const nango = getNango();

  const res = await nango.get({
    endpoint: "/admin/api/2025-01/orders.json",
    providerConfigKey: params.providerConfigKey,
    connectionId: params.connectionId,
    params: {
      status: "any",
      limit: 250,
      created_at_min: `${params.from}T00:00:00Z`,
      created_at_max: `${params.to}T23:59:59Z`,
      fields:
        "id,created_at,current_total_price,total_price,currency,financial_status,cancelled_at",
    },
  });

  return Array.isArray(res?.data?.orders) ? res.data.orders : [];
}

function sumShopifyOrdersRevenue(orders: any[]) {
  return orders.reduce((sum, order) => {
    if (order?.cancelled_at) return sum;

    const value =
      Number(order?.current_total_price ?? order?.total_price ?? 0) || 0;

    return sum + value;
  }, 0);
}

function buildShopifySalesSeries(params: {
  orders: any[];
  from: string;
  to: string;
}): SalesSeriesPoint[] {
  const valuesByDate = new Map<string, number>();

  for (const order of params.orders) {
    if (order?.cancelled_at) continue;

    const createdAt = order?.created_at;
    if (!createdAt) continue;

    const dateKey = String(createdAt).slice(0, 10);

    const value =
      Number(order?.current_total_price ?? order?.total_price ?? 0) || 0;

    valuesByDate.set(dateKey, (valuesByDate.get(dateKey) ?? 0) + value);
  }

  const series: SalesSeriesPoint[] = [];
  const start = parseYyyyMmDd(params.from);
  const end = parseYyyyMmDd(params.to);

  for (
    let cursor = new Date(start);
    cursor.getTime() <= end.getTime();
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    const dateKey = fmtYyyyMmDd(cursor);
    const t = cursor.getTime();

    series.push({
      t,
      label: formatDayLabel(t),
      value: valuesByDate.get(dateKey) ?? 0,
    });
  }

  return series;
}
async function getStripeBalance(params: {
  providerConfigKey: string;
  connectionId: string;
}) {
  const nango = getNango();

  const res = await nango.get({
    endpoint: "/v1/balance",
    providerConfigKey: params.providerConfigKey,
    connectionId: params.connectionId,
    baseUrlOverride: "https://api.stripe.com",
  });

  return res?.data;
}

type StripeBalanceItem = {
  amount: number;
  currency: string;
};

type StripeBalanceTransaction = {
  id: string;
  amount: number;
  fee: number;
  net: number;
  currency: string;
  created: number;
  type: string;
  reporting_category?: string;
};

function stripeCurrency(value: unknown): string {
  if (typeof value !== "string" || !/^[a-z]{3}$/i.test(value)) {
    throw new Error("Missing Stripe currency");
  }
  return value.toUpperCase();
}

function stripeMajorUnits(value: number, currency: string): number {
  if (!Number.isSafeInteger(value)) {
    throw new Error("Invalid Stripe monetary amount");
  }
  // Stripe retains two-decimal API units for ISK and UGX.
  const decimals = currency === "ISK" || currency === "UGX" ? 2
    : new Intl.NumberFormat("en", { style: "currency", currency })
        .resolvedOptions().maximumFractionDigits ?? 2;
  return value / (10 ** decimals);
}

function getStripeReportingCurrency(
  current: StripeBalanceTransaction[],
  previous: StripeBalanceTransaction[],
  available: StripeBalanceItem[],
  pending: StripeBalanceItem[],
): string {
  const currencies = [...new Set(
    [...current, ...previous, ...available, ...pending]
      .map((item) => stripeCurrency(item.currency)),
  )];
  if (currencies.length !== 1) {
    // Never combine currencies into a single misleading money total.
    throw new Error(currencies.length > 1
      ? "Stripe reporting requires a single settlement currency"
      : "Stripe reporting currency unavailable");
  }
  return currencies[0];
}

function sumStripeBalanceAmounts(items: StripeBalanceItem[], currency: string) {
  const amount = items.reduce((sum, item) => {
    if (stripeCurrency(item.currency) !== currency) {
      throw new Error("Mixed Stripe balance currencies");
    }
    if (!Number.isSafeInteger(item.amount)) throw new Error("Invalid Stripe balance");
    return sum + item.amount;
  }, 0);
  return stripeMajorUnits(amount, currency);
}

async function getStripeBalanceTransactions(params: {
  providerConfigKey: string;
  connectionId: string;
  from: string;
  to: string;
}): Promise<StripeBalanceTransaction[]> {
  const nango = getNango();
  const createdGte = Math.floor(parseYyyyMmDd(params.from).getTime() / 1000);
  const createdLt = Math.floor(parseYyyyMmDd(params.to).getTime() / 1000) + 86400;
  const transactions = new Map<string, StripeBalanceTransaction>();
  const cursors = new Set<string>();
  let startingAfter: string | undefined;

  while (true) {
    const response = await nango.get({
      endpoint: "/v1/balance_transactions",
      providerConfigKey: params.providerConfigKey,
      connectionId: params.connectionId,
      baseUrlOverride: "https://api.stripe.com",
      params: {
        limit: 100,
        "created[gte]": createdGte,
        "created[lt]": createdLt,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      },
    });
    const data = response.data;
    if (!Array.isArray(data?.data) || typeof data?.has_more !== "boolean") {
      throw new Error("Invalid Stripe balance transactions response");
    }
    const page = data.data as StripeBalanceTransaction[];
    for (const transaction of page) {
      if (!transaction.id || !Number.isSafeInteger(transaction.amount) ||
          !Number.isSafeInteger(transaction.fee) || !Number.isSafeInteger(transaction.net) ||
          !Number.isFinite(transaction.created) || typeof transaction.type !== "string") {
        throw new Error("Invalid Stripe balance transaction");
      }
      stripeCurrency(transaction.currency);
      // Keep the requested UTC interval even if a provider response is unexpected.
      if (transaction.created >= createdGte && transaction.created < createdLt) {
        transactions.set(transaction.id, transaction);
      }
    }
    if (!data.has_more) break;
    startingAfter = page.at(-1)?.id;
    if (!startingAfter || cursors.has(startingAfter)) {
      throw new Error("Invalid Stripe pagination cursor");
    }
    cursors.add(startingAfter);
  }
  return [...transactions.values()];
}

function stripeReportingCategory(transaction: StripeBalanceTransaction): string {
  if (transaction.reporting_category) return transaction.reporting_category;
  // Fallback for older payloads; modern Stripe reporting categories take precedence.
  if (transaction.type === "charge" || transaction.type === "payment") return "charge";
  if (transaction.type === "refund" || transaction.type === "payment_refund") return "refund";
  if (transaction.type === "refund_failure") return "refund_failure";
  if (transaction.type === "stripe_fee" || transaction.type === "stripe_fx_fee") return "fee";
  return transaction.type;
}

function sumStripeBalanceTransactions(
  transactions: StripeBalanceTransaction[],
  currency: string,
) {
  let gross = 0;
  let fees = 0;
  let net = 0;
  let payments = 0;
  let refunds = 0;
  let paymentCount = 0;
  let refundCount = 0;

  for (const transaction of transactions) {
    if (stripeCurrency(transaction.currency) !== currency) {
      throw new Error("Mixed Stripe transaction currencies");
    }
    const category = stripeReportingCategory(transaction);
    gross += transaction.amount;
    net += transaction.net;
    fees += transaction.fee;
    if (category === "fee") {
      // Standalone Stripe fee debits live in amount, not only in fee.
      fees -= transaction.amount;
    }
    if (category === "charge") {
      payments += transaction.amount;
      if (transaction.amount > 0) paymentCount += 1;
    } else if (category === "partial_capture_reversal") {
      // An uncaptured authorization is not a customer refund.
      payments += transaction.amount;
    } else if (category === "refund" || category === "refund_failure") {
      // A failed refund credits funds back. Offset it instead of inflating refunds.
      // This may be negative when an earlier period's refund is reversed now.
      refunds -= transaction.amount;
      if (category === "refund" && transaction.amount < 0) refundCount += 1;
    }
  }
  const paymentsReceived = stripeMajorUnits(payments, currency);
  const refundsIssued = stripeMajorUnits(refunds, currency);
  const feeTotal = stripeMajorUnits(fees, currency);
  const movement = Math.abs(paymentsReceived) + Math.abs(refundsIssued) + Math.abs(feeTotal);
  return {
    gross: stripeMajorUnits(gross, currency),
    fees: feeTotal,
    net: stripeMajorUnits(net, currency),
    netCashFlow: stripeMajorUnits(net, currency),
    paymentsReceived,
    refunds: refundsIssued,
    paymentCount,
    refundCount,
    paymentsShare: movement ? Math.abs(paymentsReceived) / movement * 100 : 0,
    refundsShare: movement ? Math.abs(refundsIssued) / movement * 100 : 0,
    feesShare: movement ? Math.abs(feeTotal) / movement * 100 : 0,
  };
}

function buildStripeSalesSeries(params: {
  transactions: StripeBalanceTransaction[];
  from: string;
  to: string;
  currency: string;
}): SalesSeriesPoint[] {
  const valuesByDate = new Map<string, number>();

  for (const tx of params.transactions) {
    if (!["charge", "partial_capture_reversal"].includes(stripeReportingCategory(tx))) continue;

    const created = Number(tx?.created);
    if (!Number.isFinite(created)) continue;

    const dateKey = new Date(created * 1000).toISOString().slice(0, 10);
    const value = stripeMajorUnits(tx.amount, params.currency);

    valuesByDate.set(dateKey, (valuesByDate.get(dateKey) ?? 0) + value);
  }

  const series: SalesSeriesPoint[] = [];
  const start = parseYyyyMmDd(params.from);
  const end = parseYyyyMmDd(params.to);

  for (
    let cursor = new Date(start);
    cursor.getTime() <= end.getTime();
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    const dateKey = fmtYyyyMmDd(cursor);
    const t = cursor.getTime();

    series.push({
      t,
      label: formatDayLabel(t),
      value: valuesByDate.get(dateKey) ?? 0,
    });
  }

  return series;
}

type HubSpotContact = {
  id: string;
  properties: Partial<Record<
    "firstname" | "lastname" | "company" | "associatedcompanyid" |
    "hs_lead_status" | "notes_last_updated",
    string | null
  >>;
};

async function getHubSpotContacts(connection: {
  providerConfigKey: string;
  connectionId: string;
}) {
  const nango = getNango();
  const response = await nango.post({
    ...connection,
    endpoint: "/crm/v3/objects/contacts/search",
    data: {
      limit: 50,
      sorts: [{ propertyName: "createdate", direction: "DESCENDING" }],
      properties: [
        "firstname",
        "lastname",
        "company",
        "associatedcompanyid",
        "hs_lead_status",
        "notes_last_updated",
      ],
    },
  });

  const data = response.data;
  if (
    typeof data?.total !== "number" ||
    !Number.isSafeInteger(data.total) ||
    data.total < 0 ||
    !Array.isArray(data.results)
  ) {
    throw new Error("Invalid HubSpot contacts response");
  }

  const records: HubSpotContact[] = data.results;
  const companyIds = [...new Set(records.flatMap(({ properties }) =>
    properties.associatedcompanyid ? [properties.associatedcompanyid] : [],
  ))];
  const companyNames = new Map<string, string>();

  if (companyIds.length > 0) {
    try {
      const companies = await nango.post({
        ...connection,
        endpoint: "/crm/v3/objects/companies/batch/read",
        data: {
          inputs: companyIds.map((id) => ({ id })),
          properties: ["name"],
        },
      });

      for (const company of companies.data?.results ?? []) {
        const name = company.properties?.name;
        if (typeof name === "string" && name.trim()) {
          companyNames.set(String(company.id), name.trim());
        }
      }
    } catch {
      console.warn("HUBSPOT_COMPANY_NAMES_UNAVAILABLE");
    }
  }

  return {
    contactCount: data.total,
    contacts: records.map(({ id, properties }) => ({
      id,
      name: [properties.firstname, properties.lastname]
        .filter(Boolean)
        .join(" ")
        .trim(),
      company: companyNames.get(properties.associatedcompanyid ?? "") ??
        (properties.company?.trim() || null),
      leadStatus: properties.hs_lead_status?.trim() || null,
      lastActivityAt: properties.notes_last_updated || null,
    })),
  };
}

type HubSpotConnection = {
  providerConfigKey: string;
  connectionId: string;
};

type HubSpotDeal = {
  id: string;
  archived?: boolean;
  properties: Record<string, string | null | undefined>;
};

type HubSpotPipeline = {
  id: string;
  label: string;
  displayOrder: number;
  archived?: boolean;
  stages: {
    id: string;
    label: string;
    displayOrder: number;
    archived?: boolean;
    metadata?: { isClosed?: string | boolean; probability?: string };
  }[];
};

function hubSpotNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function hubSpotCurrency(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : null;
}

async function getHubSpotDeals(connection: HubSpotConnection) {
  const nango = getNango();
  const deals = new Map<string, HubSpotDeal>();
  const cursors = new Set<string>();
  let after: string | undefined;

  do {
    const response = await nango.get({
      ...connection,
      endpoint: "/crm/v3/objects/deals",
      params: {
        limit: 100,
        archived: "false",
        properties: [
          "amount", "amount_in_home_currency", "deal_currency_code",
          "dealstage", "pipeline", "closedate", "hs_is_closed",
          "hs_is_closed_won",
        ].join(","),
        ...(after ? { after } : {}),
      },
    });
    if (!Array.isArray(response.data?.results)) {
      throw new Error("Invalid HubSpot deals response");
    }
    for (const deal of response.data.results as HubSpotDeal[]) {
      if (!deal.id || !deal.properties) {
        throw new Error("Invalid HubSpot deal record");
      }
      if (!deal.archived) deals.set(deal.id, deal);
    }
    const next = response.data?.paging?.next?.after;
    after = next === undefined || next === null ? undefined : String(next);
    if (after) {
      if (cursors.has(after)) throw new Error("Repeated HubSpot deals cursor");
      cursors.add(after);
    }
  } while (after);

  return [...deals.values()];
}

function buildHubSpotPipelineMetrics(
  deals: HubSpotDeal[],
  pipelines: HubSpotPipeline[],
  companyCurrency: string | null,
  from: string,
  to: string,
) {
  const activePipelines = pipelines.filter((pipeline) => !pipeline.archived)
    .sort((a, b) => a.displayOrder - b.displayOrder);
  const stageEntries = activePipelines.flatMap((pipeline) =>
    pipeline.stages.filter((stage) => !stage.archived)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((stage) => ({
        key: `${pipeline.id}:${stage.id}`,
        label: activePipelines.length > 1
          ? `${pipeline.label} / ${stage.label}` : stage.label,
        stage,
        value: 0,
      })),
  );
  const stagesByKey = new Map(stageEntries.map((entry) => [entry.key, entry]));
  const openDeals: HubSpotDeal[] = [];
  let won = 0;
  let lost = 0;
  const fromTime = parseYyyyMmDd(from).getTime();
  const toExclusive = parseYyyyMmDd(to).getTime() + 86400000;

  for (const deal of deals) {
    const properties = deal.properties;
    const key = `${properties.pipeline}:${properties.dealstage}`;
    const entry = stagesByKey.get(key);
    if (!entry) {
      // Do not silently omit records if pipeline configuration is inconsistent.
      throw new Error("HubSpot deal stage is missing from pipeline configuration");
    }
    entry.value += 1;
    const probability = hubSpotNumber(entry.stage.metadata?.probability);
    const isWon = properties.hs_is_closed_won === "true" ||
      (properties.hs_is_closed_won !== "false" && probability === 1);
    const isClosed = isWon || properties.hs_is_closed === "true" ||
      entry.stage.metadata?.isClosed === "true" ||
      entry.stage.metadata?.isClosed === true || probability === 0;
    if (!isClosed) openDeals.push(deal);
    else {
      const closedAt = properties.closedate ? Date.parse(properties.closedate) : NaN;
      if (closedAt >= fromTime && closedAt < toExclusive) {
        if (isWon) won += 1;
        else lost += 1;
      }
    }
  }

  // Prefer HubSpot's converted amounts in the account's currency.
  // Otherwise sum only when every open deal has the same known currency.
  const currencies = [...new Set(openDeals.map((deal) =>
    hubSpotCurrency(deal.properties.deal_currency_code) ?? companyCurrency,
  ))];
  const singleCurrency = currencies.length === 1 ? currencies[0] : null;
  const canUseHomeAmounts = Boolean(companyCurrency) && openDeals.every((deal) =>
    hubSpotNumber(deal.properties.amount_in_home_currency) !== null ||
    ((hubSpotCurrency(deal.properties.deal_currency_code) ?? companyCurrency) ===
      companyCurrency && hubSpotNumber(deal.properties.amount) !== null),
  );
  const currency = canUseHomeAmounts ? companyCurrency : singleCurrency;
  let pipelineValue: number | null = openDeals.length === 0 ? 0 : null;
  if (openDeals.length && currency) {
    const amounts = openDeals.map((deal) => canUseHomeAmounts
      ? hubSpotNumber(deal.properties.amount_in_home_currency) ??
        hubSpotNumber(deal.properties.amount)
      : hubSpotNumber(deal.properties.amount));
    if (amounts.every((amount) => amount !== null)) {
      pipelineValue = amounts.reduce<number>((sum, amount) => sum + (amount ?? 0), 0);
    }
  }
  return {
    pipelineValue,
    opportunities: openDeals.length,
    winRate: won + lost > 0 ? (won / (won + lost)) * 100 : 0,
    wonDeals: won,
    lostDeals: lost,
    closedDeals: won + lost,
    dealCount: deals.length,
    currency: currency ?? companyCurrency,
    stages: stageEntries.map(({ label, value }) => ({ label, value })),
    pipelineScope: "current_snapshot",
    winRateScope: "closed_in_selected_period",
    from,
    to,
  };
}

async function getHubSpotPipeline(
  connection: HubSpotConnection,
  from: string,
  to: string,
) {
  const nango = getNango();
  const [deals, pipelineResponse, accountResult, qualifiedResult] = await Promise.all([
    getHubSpotDeals(connection),
    nango.get({ ...connection, endpoint: "/crm/v3/pipelines/deals" }),
    nango.get({ ...connection, endpoint: "/account-info/v3/details" })
      .then((response) => hubSpotCurrency(response.data?.companyCurrency))
      .catch(() => null),
    nango.post({
      ...connection,
      endpoint: "/crm/v3/objects/contacts/search",
      data: {
        limit: 1,
        properties: ["lifecyclestage"],
        filterGroups: [{ filters: [{
          propertyName: "lifecyclestage",
          operator: "EQ",
          value: "salesqualifiedlead",
        }] }],
      },
    }).then((response) => {
      const total: unknown = response.data?.total;
      if (typeof total !== "number" || !Number.isSafeInteger(total) || total < 0) {
        throw new Error("Invalid HubSpot qualified contacts response");
      }
      return total;
    }).catch(() => null),
  ]);
  if (!Array.isArray(pipelineResponse.data?.results)) {
    throw new Error("Invalid HubSpot pipelines response");
  }
  const metrics = buildHubSpotPipelineMetrics(
    deals, pipelineResponse.data.results, accountResult, from, to,
  );
  return {
    ...metrics,
    qualifiedLeads: qualifiedResult,
    qualifiedLeadsDefinition: "contacts_with_salesqualifiedlead_lifecycle_stage",
    pipelineStatus: "ok" as const,
    metricsComplete: metrics.pipelineValue !== null && qualifiedResult !== null,
  };
}

// Read-only collectors. No demo values or UI visibility filters are used here.
type MetricConnection = { providerConfigKey: string; connectionId: string };
type SourceMetrics = BusinessSource["metrics"];

class MetricsUnavailable extends Error {}

function metricNumber(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function requiredNumber(value: unknown): number {
  const parsed = metricNumber(value);
  if (parsed === null) throw new Error("Missing numeric provider metric");
  return parsed;
}

function metricCurrency(value: unknown): string | null {
  return typeof value === "string" && /^[A-Z]{3}$/i.test(value)
    ? value.toUpperCase() : null;
}

function endOfDateWindow(to: string): string {
  return new Date(Date.parse(`${to}T00:00:00Z`) + 86400000).toISOString();
}

async function connectionConfig(connection: MetricConnection): Promise<Record<string, unknown>> {
  const details = await getNango().getConnection(connection.providerConfigKey, connection.connectionId);
  // Never return or log credentials. These fields are account selection/configuration only.
  return { ...(details.connection_config ?? {}), ...(details.metadata ?? {}) };
}

function providerSource(connection: MetricConnection, category: BusinessCategory,
  provider: string, metrics: SourceMetrics, status: CardStatus = "ok"): BusinessSource {
  return { category, provider, providerConfigKey: connection.providerConfigKey, status, metrics };
}

async function getCalendlyMetrics(c: MetricConnection, from: string, to: string): Promise<BusinessSource[]> {
  const nango = getNango();
  const me = await nango.get({ ...c, endpoint: "/users/me", baseUrlOverride: "https://api.calendly.com" });
  const user = me.data?.resource?.uri;
  if (typeof user !== "string" || !user.startsWith("https://api.calendly.com/users/")) {
    throw new MetricsUnavailable("Calendly user unavailable");
  }
  const events = new Map<string, { status: string; start: number }>();
  let pageToken: string | undefined;
  const seen = new Set<string>();
  do {
    const response = await nango.get({ ...c, endpoint: "/scheduled_events",
      baseUrlOverride: "https://api.calendly.com", params: { user, count: 100,
        min_start_time: `${from}T00:00:00Z`, max_start_time: endOfDateWindow(to),
        ...(pageToken ? { page_token: pageToken } : {}) } });
    if (!Array.isArray(response.data?.collection)) throw new Error("Invalid Calendly events response");
    for (const event of response.data.collection) {
      if (typeof event.uri !== "string" || !["active", "canceled"].includes(event.status)) {
        throw new Error("Invalid Calendly event");
      }
      const start = Date.parse(event.start_time);
      if (!Number.isFinite(start)) throw new Error("Invalid Calendly start time");
      if (start >= Date.parse(`${from}T00:00:00Z`) && start < Date.parse(endOfDateWindow(to))) {
        events.set(event.uri, { status: event.status, start });
      }
    }
    pageToken = response.data?.pagination?.next_page_token || undefined;
    if (pageToken && seen.has(pageToken)) throw new Error("Repeated Calendly cursor");
    if (pageToken) seen.add(pageToken);
  } while (pageToken);
  const values = [...events.values()];
  const canceled = values.filter((event) => event.status === "canceled").length;
  const active = values.length - canceled;
  return [providerSource(c, "booking", "calendly", {
    from, to, dateBasis: "event start time (UTC); authenticated user's events",
    totalBookings: values.length, activeBookings: active, canceledBookings: canceled,
    cancellationRate: values.length ? canceled / values.length * 100 : 0,
    upcomingBookings: values.filter((event) => event.status === "active" && event.start > Date.now()).length,
    // Attendance/no-show is not exposed by this scheduled-events endpoint.
    noShowRate: null,
  })];
}

async function getGoogleCalendarMetrics(c: MetricConnection, from: string, to: string): Promise<BusinessSource[]> {
  const nango = getNango();
  const events = new Set<string>();
  let pageToken: string | undefined;
  const seen = new Set<string>();
  do {
    const response = await nango.get({ ...c, endpoint: "/calendar/v3/calendars/primary/events",
      baseUrlOverride: "https://www.googleapis.com", params: {
        timeMin: `${from}T00:00:00Z`, timeMax: endOfDateWindow(to),
        singleEvents: "true", showDeleted: "false", maxResults: 2500,
        ...(pageToken ? { pageToken } : {}),
      } });
    if (!Array.isArray(response.data?.items)) throw new Error("Invalid Calendar events response");
    for (const event of response.data.items) {
      if (typeof event.id !== "string") throw new Error("Invalid Calendar event");
      if (event.status === "cancelled") continue;
      const declined = event.attendees?.some((attendee: { self?: boolean; responseStatus?: string }) =>
        attendee.self && attendee.responseStatus === "declined");
      if (!declined) events.add(event.id);
    }
    pageToken = response.data.nextPageToken || undefined;
    if (pageToken && seen.has(pageToken)) throw new Error("Repeated Calendar cursor");
    if (pageToken) seen.add(pageToken);
  } while (pageToken);
  return [providerSource(c, "booking", "google-calendar", {
    from, to, calendarEvents: events.size,
    dateBasis: "primary calendar events overlapping the UTC period; includes all-day events",
    metricDefinition: "Calendar events are not confirmed customer bookings or attendance records",
  })];
}

async function getBrevoMetrics(c: MetricConnection, from: string, to: string): Promise<BusinessSource[]> {
  const nango = getNango();
  if (Date.parse(`${from}T00:00:00Z`) > Date.now()) throw new MetricsUnavailable("Selected campaign period has not started");
  const campaigns = new Set<number>();
  let offset = 0;
  while (true) {
    const response = await nango.get({ ...c, endpoint: "/v3/emailCampaigns",
      baseUrlOverride: "https://api.brevo.com", params: {
        status: "sent", startDate: `${from}T00:00:00.000Z`,
        endDate: new Date(Math.min(Date.parse(endOfDateWindow(to)) - 1, Date.now())).toISOString(),
        excludeHtmlContent: "true", limit: 100, offset,
      } });
    if (!Array.isArray(response.data?.campaigns)) throw new Error("Invalid Brevo campaigns response");
    const rows = response.data.campaigns;
    const prior = campaigns.size;
    for (const row of rows) {
      if (typeof row.id !== "number") throw new Error("Invalid Brevo campaign");
      campaigns.add(row.id);
    }
    if (rows.length < 100) break;
    if (campaigns.size === prior) throw new Error("Repeated Brevo page");
    offset += 100;
  }
  // Campaign lifetime opens/clicks are deliberately not represented as period traffic.
  return [providerSource(c, "marketing", "brevo", {
    from, to, sentCampaigns: campaigns.size, dateBasis: "campaigns sent in the UTC period",
  })];
}

async function getMetaMetrics(c: MetricConnection, from: string, to: string): Promise<BusinessSource[]> {
  const nango = getNango();
  const version = process.env.META_GRAPH_API_VERSION?.trim() || "v27.0";
  if (!/^v\d+\.0$/.test(version)) throw new MetricsUnavailable("Invalid Meta API version");
  const accounts = new Map<string, string | null>();
  const seen = new Set<string>();
  let after: string | undefined;
  do {
    const response = await nango.get({ ...c, endpoint: `/${version}/me/adaccounts`,
      baseUrlOverride: "https://graph.facebook.com", params: { fields: "id,currency", limit: 100,
        ...(after ? { after } : {}) } });
    if (!Array.isArray(response.data?.data)) throw new Error("Invalid Meta accounts response");
    for (const row of response.data.data) {
      if (typeof row.id !== "string" || !/^act_\d+$/.test(row.id)) throw new Error("Invalid Meta account");
      accounts.set(row.id, metricCurrency(row.currency));
    }
    after = response.data?.paging?.next ? response.data?.paging?.cursors?.after : undefined;
    if (response.data?.paging?.next && !after) throw new Error("Missing Meta page cursor");
    if (after && seen.has(after)) throw new Error("Repeated Meta cursor");
    if (after) seen.add(after);
  } while (after);
  if (!accounts.size) throw new MetricsUnavailable("No accessible Meta advertising account");
  const sources: BusinessSource[] = [];
  for (const [id, code] of accounts) {
    try {
      const response = await nango.get({ ...c, endpoint: `/${version}/${id}/insights`,
        baseUrlOverride: "https://graph.facebook.com", params: {
          level: "account", fields: "impressions,reach,clicks,spend,actions,date_start,date_stop",
          time_range: JSON.stringify({ since: from, until: to }),
        } });
      if (!Array.isArray(response.data?.data) || response.data.data.length > 1 || response.data?.paging?.next) {
        throw new Error("Invalid Meta insights response");
      }
      const row = response.data.data[0];
      // An empty Insights result contains no explicit numeric observation.
      const metrics: SourceMetrics = { from, to, accountId: id, currency: code,
        dateBasis: "ad account reporting timezone", scope: "paid advertising only",
        impressions: row ? metricNumber(row.impressions) : null,
        reach: row ? metricNumber(row.reach) : null,
        clicks: row ? metricNumber(row.clicks) : null,
        spend: row ? metricNumber(row.spend) : null,
        engagements: row && Array.isArray(row.actions)
          ? metricNumber(row.actions.find((action: { action_type: string }) => action.action_type === "post_engagement")?.value)
          : null,
      };
      const status: CardStatus = row ? "ok" : "warn";
      sources.push(providerSource(c, "marketing", "meta-marketing-api", metrics, status));
      sources.push(providerSource(c, "socialMedia", "meta-marketing-api", {
        from, to, accountId: id, scope: "paid advertising only; not organic social performance",
        dateBasis: "ad account reporting timezone", reach: metrics.reach,
        engagements: metrics.engagements, impressions: metrics.impressions,
      }, status));
    } catch (error) {
      const issue = collectionFailure(error);
      for (const category of ["marketing", "socialMedia"] as const) {
        sources.push(providerSource(c, category, "meta-marketing-api", { from, to, accountId: id, issue: issue.note }, issue.status));
      }
    }
  }
  return sources;
}

async function getGoogleAdsMetrics(c: MetricConnection, from: string, to: string): Promise<BusinessSource[]> {
  const nango = getNango();
  const version = process.env.GOOGLE_ADS_API_VERSION?.trim() || "v26";
  if (!/^v\d+$/.test(version)) throw new MetricsUnavailable("Invalid Google Ads API version");
  const headers: Record<string, string> = {};
  // Older deployed API versions may still require this application credential.
  if (process.env.GOOGLE_ADS_DEVELOPER_TOKEN) headers["developer-token"] = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const accessible = await nango.get({ ...c, headers,
    endpoint: `/${version}/customers:listAccessibleCustomers`, baseUrlOverride: "https://googleads.googleapis.com" });
  const resources = accessible.data?.resourceNames;
  if (!Array.isArray(resources)) throw new Error("Invalid Google Ads accounts response");
  if (!resources.length) throw new MetricsUnavailable("No accessible Google Ads account");
  const sources: BusinessSource[] = [];
  // Manager rows discover their child client accounts; each client keeps its own currency and metrics.
  const targets = new Map<string, string | undefined>();
  for (const resource of resources) {
    if (typeof resource !== "string" || !/^customers\/\d+$/.test(resource)) throw new Error("Invalid Google Ads customer");
    const id = resource.split("/")[1];
    try {
      const rows = await googleAdsQuery(c, version, id, headers,
        "SELECT customer_client.client_customer, customer_client.manager FROM customer_client WHERE customer_client.status = 'ENABLED'");
      for (const row of rows) {
        const client = row.customerClient;
        if (client && client.manager !== true && /^customers\/\d+$/.test(client.clientCustomer)) {
          const childId = client.clientCustomer.split("/")[1];
          if (!targets.has(childId) || client.clientCustomer === resource) {
            targets.set(childId, client.clientCustomer === resource ? undefined : id);
          }
        }
      }
    } catch (error) {
      const issue = collectionFailure(error);
      sources.push(providerSource(c, "marketing", "google-ads", { from, to, accountId: id, issue: issue.note }, issue.status));
    }
  }
  if (!targets.size && !sources.length) throw new MetricsUnavailable("No accessible Google Ads client account");
  for (const [id, manager] of targets) {
    try {
      const rows = await googleAdsQuery(c, version, id, { ...headers, ...(manager ? { "login-customer-id": manager } : {}) },
        `SELECT customer.currency_code, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM customer WHERE segments.date BETWEEN '${from}' AND '${to}'`);
      if (rows.length > 1) throw new Error("Unexpected Google Ads aggregation");
      const row = rows[0];
      sources.push(providerSource(c, "marketing", "google-ads", {
        from, to, accountId: id, dateBasis: "ad account reporting timezone",
        impressions: row ? metricNumber(row.metrics?.impressions) : null,
        clicks: row ? metricNumber(row.metrics?.clicks) : null,
        conversions: row ? metricNumber(row.metrics?.conversions) : null,
        spend: row && metricNumber(row.metrics?.costMicros) !== null ? Number(row.metrics.costMicros) / 1000000 : null,
        currency: metricCurrency(row?.customer?.currencyCode),
      }, row ? "ok" : "warn"));
    } catch (error) {
      const issue = collectionFailure(error);
      sources.push(providerSource(c, "marketing", "google-ads", { from, to, accountId: id, issue: issue.note }, issue.status));
    }
  }
  return sources;
}

async function googleAdsQuery(c: MetricConnection, version: string, id: string,
  headers: Record<string, string>, query: string): Promise<any[]> {
  const response = await getNango().post({ ...c, headers,
    baseUrlOverride: "https://googleads.googleapis.com", endpoint: `/${version}/customers/${id}/googleAds:searchStream`, data: { query } });
  if (!Array.isArray(response.data)) throw new Error("Invalid Google Ads stream");
  return response.data.flatMap((chunk: { results?: unknown; error?: unknown }) => {
    if (chunk.error || (chunk.results !== undefined && !Array.isArray(chunk.results))) throw new Error("Invalid Google Ads rows");
    return chunk.results ?? [];
  });
}

async function getWooCommerceMetrics(c: MetricConnection, from: string, to: string): Promise<BusinessSource[]> {
  const nango = getNango();
  const orders = new Map<number, any>();
  let page = 1;
  while (true) {
    // Nango resolves the tenant-specific storeURL and attaches its Basic credentials.
    const response = await nango.get({ ...c, endpoint: "/wp-json/wc/v3/orders", params: {
      after: `${from}T00:00:00`, before: `${to}T23:59:59`, dates_are_gmt: "true",
      per_page: 100, page, orderby: "id", order: "asc",
    } });
    if (!Array.isArray(response.data)) throw new Error("Invalid WooCommerce orders response");
    const previous = orders.size;
    for (const order of response.data) {
      if (typeof order.id !== "number" || typeof order.status !== "string") throw new Error("Invalid WooCommerce order");
      orders.set(order.id, order);
    }
    if (response.data.length < 100) break;
    if (orders.size === previous) throw new Error("Repeated WooCommerce page");
    page++;
  }
  // Keep order creation cohort gross totals separate from settlement-period refunds/revenue.
  const eligible = [...orders.values()].filter((order) => ["processing", "completed", "refunded"].includes(order.status));
  const groups = new Map<string, { total: number; count: number; refunds: number }>();
  for (const order of eligible) {
    const code = metricCurrency(order.currency);
    if (!code) throw new Error("Missing WooCommerce currency");
    const group = groups.get(code) ?? { total: 0, count: 0, refunds: 0 };
    group.total += requiredNumber(order.total);
    group.count++;
    if (!Array.isArray(order.refunds)) throw new Error("Missing WooCommerce refund collection");
    for (const refund of order.refunds) group.refunds += Math.abs(requiredNumber(refund.total));
    groups.set(code, group);
  }
  if (!groups.size) return [providerSource(c, "sales", "woocommerce", {
    from, to, orderCount: 0, orderTotal: null, currency: null,
    dateBasis: "orders created in UTC period; processing/completed/refunded",
  })];
  return [...groups].map(([code, group]) => providerSource(c, "sales", "woocommerce", {
    from, to, currency: code, orderCount: group.count, orderTotal: group.total,
    refundsOnTheseOrders: group.refunds,
    dateBasis: "orders created in UTC period; totals include tax/shipping; refunds are lifetime for this cohort",
  }));
}

async function getQuickBooksMetrics(c: MetricConnection, from: string, to: string): Promise<BusinessSource[]> {
  const config = await connectionConfig(c);
  const realmId = config.realmId;
  if (typeof realmId !== "string" || !/^\d+$/.test(realmId)) throw new MetricsUnavailable("QuickBooks realmId missing");
  const response = await getNango().get({ ...c, endpoint: `/v3/company/${realmId}/reports/ProfitAndLoss`,
    params: { start_date: from, end_date: to, summarize_column_by: "Total", accounting_method: "Accrual" },
    headers: { Accept: "application/json" },
  });
  const report = response.data;
  if (!report?.Header || !report?.Rows) throw new Error("Invalid QuickBooks report");
  const findGroup = (rows: any[], name: string): number | null => {
    for (const row of rows) {
      if (row.group === name) return metricNumber(row.Summary?.ColData?.[1]?.value);
      const nested = findGroup(row.Rows?.Row ?? [], name);
      if (nested !== null) return nested;
    }
    return null;
  };
  const rows = report.Rows.Row ?? [];
  if (!Array.isArray(rows)) throw new Error("Invalid QuickBooks report rows");
  if ((report.Header.StartPeriod && report.Header.StartPeriod !== from) ||
      (report.Header.EndPeriod && report.Header.EndPeriod !== to)) throw new Error("QuickBooks reporting period mismatch");
  return [providerSource(c, "finance", "quickbooks", {
    from, to, realmId, currency: metricCurrency(report.Header.Currency),
    netIncome: findGroup(rows, "NetIncome"), totalIncome: findGroup(rows, "Income"),
    totalExpenses: findGroup(rows, "Expenses"),
    dateBasis: "accrual Profit and Loss for selected dates; not Stripe settlement cash flow",
  })];
}

async function getSalesforceMetrics(c: MetricConnection, from: string, to: string): Promise<BusinessSource[]> {
  const nango = getNango();
  const versions = await nango.get({ ...c, endpoint: "/services/data/" });
  if (!Array.isArray(versions.data) || !versions.data.length) throw new Error("Invalid Salesforce versions response");
  const selected = [...versions.data].sort((a, b) => Number(b.version) - Number(a.version))[0];
  if (!/^\d+\.0$/.test(selected.version)) throw new Error("Invalid Salesforce API version");
  const prefix = `/services/data/v${selected.version}`;
  const query = async (q: string): Promise<Array<Record<string, unknown>>> => {
    const response = await nango.get({ ...c, endpoint: `${prefix}/query`, params: { q } });
    if (!Array.isArray(response.data?.records) || response.data.done !== true) throw new Error("Incomplete Salesforce aggregate response");
    return response.data.records;
  };
  const [open, leads, closed] = await Promise.all([
    query("SELECT COUNT(Id) total FROM Opportunity WHERE IsClosed = false"),
    query(`SELECT COUNT(Id) total FROM Lead WHERE CreatedDate >= ${from}T00:00:00Z AND CreatedDate < ${endOfDateWindow(to)}`),
    query(`SELECT IsWon, COUNT(Id) total FROM Opportunity WHERE IsClosed = true AND CloseDate >= ${from} AND CloseDate <= ${to} GROUP BY IsWon`),
  ]);
  const closedCount = closed.reduce((sum, row) => sum + requiredNumber(row.total), 0);
  const won = closed.filter((row) => row.IsWon === true).reduce((sum, row) => sum + requiredNumber(row.total), 0);
  return [providerSource(c, "crm", "salesforce", {
    from, to, opportunities: requiredNumber(open[0]?.total), leads: requiredNumber(leads[0]?.total),
    closedDeals: closedCount, wonDeals: won, winRate: closedCount ? won / closedCount * 100 : null,
    dateBasis: "opportunities=current open snapshot; leads=created in UTC period; won/closed=close date period",
  })];
}

function collectionFailure(error: unknown): { status: CardStatus; note: string } {
  if (error instanceof MetricsUnavailable) return { status: "warn", note: error.message };
  const status = (error as { response?: { status?: number } })?.response?.status;
  if (status === 403) return { status: "warn", note: "Provider permission or account access required" };
  if (status === 429) return { status: "warn", note: "Provider rate limit; retry later" };
  return { status: "error", note: "Provider metrics could not be retrieved" };
}

async function collectAdditionalSources(connections: Array<{
  key: IntegrationKey; providerConfigKey: string; connectionId?: string | null; lookupFailed: boolean;
}>, from: string, to: string): Promise<BusinessSource[]> {
  type Collector = (c: MetricConnection, from: string, to: string) => Promise<BusinessSource[]>;
  const collectors: Array<{ key: IntegrationKey; categories: BusinessCategory[]; run: Collector }> = [
    { key: "calendly", categories: ["booking"], run: getCalendlyMetrics },
    { key: "googleCalendar", categories: ["booking"], run: getGoogleCalendarMetrics },
    { key: "brevo", categories: ["marketing"], run: getBrevoMetrics },
    { key: "googleAds", categories: ["marketing"], run: getGoogleAdsMetrics },
    { key: "meta", categories: ["marketing", "socialMedia"], run: getMetaMetrics },
    { key: "woocommerce", categories: ["sales"], run: getWooCommerceMetrics },
    { key: "quickbooks", categories: ["finance"], run: getQuickBooksMetrics },
    { key: "salesforce", categories: ["crm"], run: getSalesforceMetrics },
  ];
  const results = await Promise.all(collectors.map(async ({ key, categories, run }) => {
    const connection = connections.find((item) => item.key === key);
    const providerConfigKey = connection?.providerConfigKey ?? NANGO_INTEGRATION_ID[key];
    const unavailable = (status: CardStatus, note: string) => categories.map((category) => ({
      category, provider: providerConfigKey, providerConfigKey, status,
      metrics: { from, to, issue: note },
    }));
    if (!connection?.connectionId) return unavailable(connection?.lookupFailed ? "error" : "disabled",
      connection?.lookupFailed ? "Connection lookup failed" : "Provider not connected");
    try {
      return await run({ providerConfigKey, connectionId: connection.connectionId }, from, to);
    } catch (error) {
      const issue = collectionFailure(error);
      console.error("DASHBOARD_METRICS_FETCH_FAILED", { providerConfigKey, status: issue.status });
      return unavailable(issue.status, issue.note);
    }
  }));
  return results.flat();
}

export async function getDashboardHydration(params: {
  from: string | Date;
  to: string | Date;
  endUserId: string;
}) {
  const from = toYyyyMmDd(params.from);
  const to = toYyyyMmDd(params.to);
  const endUserId = params.endUserId;
  for (const date of [from, to]) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) ||
        new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) {
      throw new Error("Invalid dashboard date range");
    }
  }
  if (from > to) throw new Error("Invalid dashboard date range");

const integrationConnections = await Promise.all(
  INTEGRATION_DEFINITIONS.map(async (integration) => {
    try {
      const connectionId = await findNangoConnectionId({
        providerConfigKey: integration.providerConfigKey,
        endUserId,
      });

      return {
        ...integration,
        connected: Boolean(connectionId),
        connectionId,
        lookupFailed: false,
      };
    } catch (error) {
      console.error("DASHBOARD_CONNECTION_LOOKUP_FAILED", {
        providerConfigKey: integration.providerConfigKey,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        ...integration,
        connected: false,
        connectionId: undefined,
        lookupFailed: true,
      };
    }
  }),
);

const additionalSourcesPromise = collectAdditionalSources(integrationConnections, from, to);

const connectionFor = (key: IntegrationKey) =>
  integrationConnections.find((integration) => integration.key === key);

const gaProviderConfigKey = NANGO_INTEGRATION_ID.google;
const shopifyProviderConfigKey = NANGO_INTEGRATION_ID.shopify;
const metaProviderConfigKey = NANGO_INTEGRATION_ID.meta;
const stripeProviderConfigKey = NANGO_INTEGRATION_ID.stripe;
const googleAdsProviderConfigKey = NANGO_INTEGRATION_ID.googleAds;

const gaConnectionId = connectionFor("google")?.connectionId;
const gaConnected = Boolean(gaConnectionId);

const shopifyConnectionId = connectionFor("shopify")?.connectionId;
const shopifyConnected = Boolean(shopifyConnectionId);

const metaConnectionId = connectionFor("meta")?.connectionId;
const metaConnected = Boolean(metaConnectionId);

const stripeConnectionId = connectionFor("stripe")?.connectionId;
const stripeConnected = Boolean(stripeConnectionId);

const googleAdsConnectionId = connectionFor("googleAds")?.connectionId;
const googleAdsConnected = Boolean(googleAdsConnectionId);

  const hubspot = connectionFor("hubspot");
  const hubspotContacts = (async () => {
    if (!hubspot?.connectionId) return null;

    try {
      return await getHubSpotContacts({
        providerConfigKey: hubspot.providerConfigKey,
        connectionId: hubspot.connectionId,
      });
    } catch {
      console.error("HUBSPOT_CONTACTS_FETCH_FAILED");
      return null;
    }
  })();
  const hubspotPipeline = (async () => {
    if (!hubspot?.connectionId) return null;
    try {
      return await getHubSpotPipeline({
        providerConfigKey: hubspot.providerConfigKey,
        connectionId: hubspot.connectionId,
      }, from, to);
    } catch (error: unknown) {
      const responseStatus = (error as { response?: { status?: number } })
        ?.response?.status;
      // Do not log tokens, contact data or entire provider error responses.
      console.error("HUBSPOT_PIPELINE_FETCH_FAILED", { status: responseStatus });
      return null;
    }
  })();
  let gaStatus: CardStatus = gaConnected ? "warn" : "disabled";
  let gaValue = gaConnected ? "Ready to fetch metrics" : "—";
  let gaDelta: string | undefined;
  let gaMeta: Record<string, any> = { from, to, series: [] };

  if (gaConnected && gaConnectionId) {
    try {
      const propertyId = await getFirstGa4PropertyId({
        providerConfigKey: gaProviderConfigKey,
        connectionId: gaConnectionId,
      });

      if (!propertyId) {
        gaStatus = "warn";
        gaValue = "No GA4 property found";
      } else {
        const { prevFrom, prevTo } = previousPeriod(from, to);

        const [current, prev, series] = await Promise.all([
          runGaReport({
            providerConfigKey: gaProviderConfigKey,
            connectionId: gaConnectionId,
            propertyId,
            from,
            to,
          }),
          runGaReport({
            providerConfigKey: gaProviderConfigKey,
            connectionId: gaConnectionId,
            propertyId,
            from: prevFrom,
            to: prevTo,
          }),
          runGaDailySeriesReport({
            providerConfigKey: gaProviderConfigKey,
            connectionId: gaConnectionId,
            propertyId,
            from,
            to,
          }),
        ]);

       gaStatus = "ok";
      gaValue = `${formatInt(current.users)} users`;
      gaDelta = pctDelta(current.users, prev.users);
      gaMeta = {
       ...gaMeta,
      propertyId,
      prevFrom,
      prevTo,
      users: current.users,
      sessions: current.sessions,
      newUsers: current.newUsers,
      views: current.views,
      previousUsers: prev.users,
      previousSessions: prev.sessions,
      previousNewUsers: prev.newUsers,
      previousViews: prev.views,
      series,
      };
      }
    } catch (e: any) {
      console.error("GA_FETCH_FAILED:", e?.response?.data || e?.message || e);

      gaStatus = "error";
      gaValue = "GA fetch failed";
      gaMeta = {
        ...gaMeta,
        error: e?.response?.data ?? e?.message ?? "unknown",
        series: [],
      };
    }
  }

  let salesStatus: CardStatus = shopifyConnected ? "warn" : "disabled";
  let salesValue = shopifyConnected ? "Ready to fetch sales" : "—";
  let salesDelta: string | undefined;
  let salesMeta: Record<string, any> = {
    from,
    to,
    provider: "shopify",
    sourceLabel: "Shopify orders",
    series: [],
  };

  if (shopifyConnected && shopifyConnectionId) {
    try {
      const { prevFrom, prevTo } = previousPeriod(from, to);

      const [currentOrders, prevOrders] = await Promise.all([
        getShopifyOrders({
          providerConfigKey: shopifyProviderConfigKey,
          connectionId: shopifyConnectionId,
          from,
          to,
        }),
        getShopifyOrders({
          providerConfigKey: shopifyProviderConfigKey,
          connectionId: shopifyConnectionId,
          from: prevFrom,
          to: prevTo,
        }),
      ]);

      console.log("SHOPIFY_SALES_DEBUG", {
        endUserId,
        connectionId: shopifyConnectionId,
        from,
        to,
        prevFrom,
        prevTo,
        currentOrderCount: currentOrders.length,
        previousOrderCount: prevOrders.length,
      });

      const currentRevenue = sumShopifyOrdersRevenue(currentOrders);
      const prevRevenue = sumShopifyOrdersRevenue(prevOrders);

      const currency =
        currentOrders.find((order: any) => typeof order?.currency === "string")
          ?.currency ??
        prevOrders.find((order: any) => typeof order?.currency === "string")
          ?.currency ??
        "EUR";

      const series = buildShopifySalesSeries({
        orders: currentOrders,
        from,
        to,
      });

      salesStatus = "ok";
      salesValue = formatCurrency(currentRevenue, currency);
      salesDelta = pctDelta(currentRevenue, prevRevenue);
      salesMeta = {
        ...salesMeta,
        prevFrom,
        prevTo,
        currency,
        orderCount: currentOrders.length,
        previousOrderCount: prevOrders.length,
        currentRevenue,
        previousRevenue: prevRevenue,
        series,
      };
    } catch (e: any) {
      console.error(
        "SHOPIFY_SALES_FETCH_FAILED:",
        e?.response?.data || e?.message || e
      );

      salesStatus = "error";
      salesValue = "Shopify sales fetch failed";
      salesMeta = {
        ...salesMeta,
        error: e?.response?.data ?? e?.message ?? "unknown",
        series: [],
      };
    }
  }

  let stripeSalesStatus: CardStatus = stripeConnected ? "warn" : "disabled";
  let stripeSalesValue = stripeConnected ? "Ready to fetch payments" : "—";
  let stripeSalesDelta: string | undefined;
  let stripeSalesMeta: Record<string, any> = {
    from,
    to,
    provider: "stripe",
    sourceLabel: "Stripe payments",
    series: [],
  };

  let accountingStatus: CardStatus = stripeConnected ? "warn" : "disabled";
  let accountingValue = stripeConnected ? "Ready to fetch accounting" : "—";
  let accountingMeta: Record<string, any> = {
    from,
    to,
    provider: "stripe",
  };

  if (stripeConnected && stripeConnectionId) {
    try {
      const { prevFrom, prevTo } = previousPeriod(from, to);

      const [currentTxs, prevTxs, balance] = await Promise.all([
      getStripeBalanceTransactions({
      providerConfigKey: stripeProviderConfigKey,
      connectionId: stripeConnectionId,
      from,
      to,
      }),
      getStripeBalanceTransactions({
      providerConfigKey: stripeProviderConfigKey,
      connectionId: stripeConnectionId,
      from: prevFrom,
      to: prevTo,
      }),
      getStripeBalance({
      providerConfigKey: stripeProviderConfigKey,
      connectionId: stripeConnectionId,
      }),
    ]);

      console.log("STRIPE_SALES_DEBUG", {
        endUserId,
        connectionId: stripeConnectionId,
        from,
        to,
        prevFrom,
        prevTo,
        currentTransactionCount: currentTxs.length,
        previousTransactionCount: prevTxs.length,
      });

      if (!Array.isArray(balance?.available) || !Array.isArray(balance?.pending)) {
        throw new Error("Invalid Stripe balance response");
      }
      const currency = getStripeReportingCurrency(
        currentTxs, prevTxs, balance.available, balance.pending,
      );
      const current = sumStripeBalanceTransactions(currentTxs, currency);
      const previous = sumStripeBalanceTransactions(prevTxs, currency);

      const series = buildStripeSalesSeries({
        transactions: currentTxs,
        from,
        to,
        currency,
      });

      stripeSalesStatus = "ok";
      stripeSalesValue = formatCurrency(current.paymentsReceived, currency);
      stripeSalesDelta = pctDelta(current.paymentsReceived, previous.paymentsReceived);
      stripeSalesMeta = {
        ...stripeSalesMeta,
        prevFrom,
        prevTo,
        currency,
        currentRevenue: current.paymentsReceived,
        previousRevenue: previous.paymentsReceived,
        transactionCount: currentTxs.length,
        previousTransactionCount: prevTxs.length,
        fees: current.fees,
        net: current.net,
        series,
      };
      const pendingBalance = sumStripeBalanceAmounts(
      balance.pending, currency,
      );

      const availableBalance = sumStripeBalanceAmounts(
      balance.available, currency,
      );

      accountingStatus = "ok";
      accountingValue = formatCurrency(pendingBalance + availableBalance, currency);
      accountingMeta = {
      ...accountingMeta,
      ...current,
      currency,
      balanceScope: "current_snapshot",
      activityScope: "ledger_transactions_in_selected_utc_period",
      refundsScope: "net_refund_balance_movements_in_selected_period",
      pendingBalance,
      availableBalance,
      totalBalance: pendingBalance + availableBalance,
      transactionCount: currentTxs.length,
    };
    } catch (e: any) {
      console.error(
        "STRIPE_FETCH_FAILED:",
        e?.response?.data || e?.message || e
      );

      stripeSalesStatus = "error";
      stripeSalesValue = "Stripe fetch failed";
      stripeSalesMeta = {
        ...stripeSalesMeta,
        error: e?.response?.data ?? e?.message ?? "unknown",
        series: [],
      };

      accountingStatus = "error";
      accountingValue = "Stripe accounting fetch failed";
      accountingMeta = {
        ...accountingMeta,
        error: e?.response?.data ?? e?.message ?? "unknown",
      };
    }
  }
  const [crm, crmPipeline] = await Promise.all([hubspotContacts, hubspotPipeline]);
  const crmStatus: CardStatus = crm && crmPipeline
    ? crmPipeline.metricsComplete ? "ok" : "warn"
    : crm || crmPipeline ? "warn"
    : hubspot?.connectionId || hubspot?.lookupFailed ? "error" : "disabled";


  const additionalSources = await additionalSourcesPromise;
  const updatedAt = new Date().toISOString();
  const businessSources: BusinessSource[] = [
  {
    category: "crm",
    provider: "hubspot",
    providerConfigKey: hubspot?.providerConfigKey ?? NANGO_INTEGRATION_ID.hubspot,
    status: crmStatus,
    metrics: {
      from, to,
      dateBasis: "contacts and open pipeline=current snapshot; win rate=deals closed in selected period",
      contactCount: crm?.contactCount ?? null,
      pipelineValue: crmPipeline?.pipelineValue ?? null,
      opportunities: crmPipeline?.opportunities ?? null,
      qualifiedLeads: crmPipeline?.qualifiedLeads ?? null,
      winRate: crmPipeline?.winRate ?? null,
      closedDeals: crmPipeline?.closedDeals ?? null,
      currency: crmPipeline?.currency ?? null,
    },
  },
  {
    category: "analytics",
    provider: "google-analytics",
    providerConfigKey: gaProviderConfigKey,
    status: gaStatus,
    metrics: {
      from, to, dateBasis: "GA4 property reporting timezone",
      sessions: gaStatus === "ok" ? gaMeta.sessions ?? null : null,
      users: gaStatus === "ok" ? gaMeta.users ?? null : null,
      views: gaStatus === "ok" ? gaMeta.views ?? null : null,
    },
  },
  {
    category: "sales",
    provider: "shopify",
    providerConfigKey: shopifyProviderConfigKey,
    status: salesStatus,
    metrics: {
      from, to, dateBasis: "Shopify orders created in selected period",
      revenue: salesStatus === "ok" ? salesMeta.currentRevenue ?? null : null,
      orderCount: salesStatus === "ok" ? salesMeta.orderCount ?? null : null,
      currency: salesStatus === "ok" ? salesMeta.currency ?? null : null,
    },
  },
  {
    category: "sales",
    provider: "stripe",
    providerConfigKey: stripeProviderConfigKey,
    status: stripeSalesStatus,
    metrics: {
      from, to, dateBasis: "Stripe charges created in selected period",
      gross: stripeSalesStatus === "ok" ? stripeSalesMeta.currentRevenue ?? null : null,
      transactionCount:
        stripeSalesStatus === "ok" ? stripeSalesMeta.transactionCount ?? null : null,
      currency: stripeSalesStatus === "ok" ? stripeSalesMeta.currency ?? null : null,
    },
  },
  {
    category: "finance",
    provider: "stripe",
    providerConfigKey: stripeProviderConfigKey,
    status: accountingStatus,
    metrics: {
      from, to, dateBasis: "Stripe balance=current snapshot; net/payments/refunds/fees=selected transaction period",
      totalBalance:
        accountingStatus === "ok" ? accountingMeta.totalBalance ?? null : null,
      fees: accountingStatus === "ok" ? accountingMeta.fees ?? null : null,
      net: accountingStatus === "ok" ? accountingMeta.net ?? null : null,
      currency: accountingStatus === "ok" ? accountingMeta.currency ?? null : null,
      paymentsReceived: accountingStatus === "ok" ? accountingMeta.paymentsReceived ?? null : null,
      refunds: accountingStatus === "ok" ? accountingMeta.refunds ?? null : null,
      netCashFlow: accountingStatus === "ok" ? accountingMeta.netCashFlow ?? null : null,
    },
  },
  ...additionalSources,
  {
    category: "downtime", provider: "unconfigured", providerConfigKey: "unconfigured",
    status: "disabled", metrics: { from, to, issue: "No uptime monitoring provider configured" },
  },
];

  const anyConnected = integrationConnections.some(
  (integration) => integration.connected,
  );

const anyConnectionLookupFailed = integrationConnections.some(
  (integration) => integration.lookupFailed,
);

  const hydration: DashboardHydration = {
    range: { from, to },
    businessSources,
    integrations: integrationConnections.map(
  ({ key, providerConfigKey, connected, connectionId }) => ({
    key,
    providerConfigKey,
    connected,
    connectionId,
  }),
),
    cards: [
    {
  key: "integrations",
  title: "Integrations",
  status: anyConnectionLookupFailed
    ? "warn"
    : anyConnected
      ? "ok"
      : "disabled",
  value: anyConnectionLookupFailed
    ? "Some connection checks failed"
    : anyConnected
      ? "Providers connected"
      : "Connect a provider",
  meta: {
    connectedIntegrations: integrationConnections
      .filter((integration) => integration.connected)
      .map(({ key, label, providerConfigKey, connected, connectionId }) => ({
        key,
        label,
        providerConfigKey,
        connected,
        connectionId,
      })),
    failedConnectionChecks: integrationConnections
      .filter((integration) => integration.lookupFailed)
      .map(({ key }) => key),
  },
},
      {
        key: "ga_overview",
        title: "Traffic (GA4)",
        status: gaStatus,
        value: gaValue,
        delta: gaDelta,
        meta:{ ...gaMeta,
        updatedAt,
        },
      },
      {
         key: "sales",
          title: "Sales",
          status: salesStatus,
          value: salesValue,
          delta: salesDelta,
           meta: {
           ...salesMeta,
          updatedAt,
        },
      },
      {
        key: "stripe_sales",
          title: "Stripe Payments",
          status: stripeSalesStatus,
          value: stripeSalesValue,
          delta: stripeSalesDelta,
          meta: {
         ...stripeSalesMeta,
          updatedAt,
      },
      },
            {
        key: "crm",
        title: "CRM / Pipeline",
        status: crmStatus,
        value: crm ? `${formatInt(crm.contactCount)} contacts`
          : crmPipeline ? `${formatInt(crmPipeline.dealCount)} deals` : "—",
        delta: hubspot?.connectionId && !crmPipeline ? "Pipeline unavailable"
          : crmPipeline && !crmPipeline.metricsComplete ? "Some CRM metrics unavailable"
          : !crm && crmPipeline ? "Contacts unavailable" : undefined,
        meta: {
          ...(crm ?? {}),
          ...(crmPipeline ?? {}),
          contactsStatus: crm ? "ok" : hubspot?.connectionId ? "error" : "disabled",
          pipelineStatus: crmPipeline ? "ok" : hubspot?.connectionId ? "error" : "disabled",
          updatedAt,
        },
      },
      {
        key: "accounting",
        title: "Accounting",
        status: accountingStatus,
        value: accountingValue,
        meta:{
          ...accountingMeta,
          updatedAt,
        } 
      },
      {
  key: "google_ads",
  title: "Marketing",
  status: googleAdsConnected ? "warn" : "disabled",
  value: googleAdsConnected ? "Google Ads connected" : "Connect Google Ads",
  delta: googleAdsConnected ? "Awaiting campaign data" : undefined,
  meta: {
    providerConfigKey: googleAdsProviderConfigKey,
    connectionId: googleAdsConnectionId,
    accessLevel: googleAdsConnected ? "oauth_connected" : "not_connected",
    from,
    to,
    updatedAt,
  },
},
{
  key: "meta_ads",
  title: "Social Network",
  status: metaConnected ? "warn" : "disabled",
  value: metaConnected ? "Basic OAuth connected" : "Connect Meta Ads",
  delta: metaConnected ? "Limited access" : undefined,
  meta: {
    providerConfigKey: metaProviderConfigKey,
    connectionId: metaConnectionId,
    accessLevel: metaConnected ? "basic_oauth" : "not_connected",
    from,
    to,
    updatedAt,
  },
    },
    ],
  };

  for (const [key, provider, category] of [
    ["google_ads", "google-ads", "marketing"],
    ["meta_ads", "meta-marketing-api", "socialMedia"],
  ] as const) {
    const card = hydration.cards.find((item) => item.key === key);
    const sources = additionalSources.filter((source) => source.category === category && source.providerConfigKey === provider);
    const usable = sources.filter((source) => source.status === "ok");
    if (card && sources.length) {
      card.status = usable.length === sources.length ? "ok" : usable.length ? "warn"
        : sources.some((source) => source.status === "error") ? "error"
        : sources.some((source) => source.status === "warn") ? "warn" : "disabled";
      card.value = usable.length ? "Metrics available" : card.status === "disabled" ? "—" : "Metrics unavailable";
      card.delta = undefined;
      card.meta = { ...card.meta, sources, ...(usable.length === 1 ? usable[0].metrics : {}), updatedAt };
    }
  }
  const bookingSources = additionalSources.filter((source) => source.category === "booking");
  const calendly = bookingSources.find((source) => source.providerConfigKey === NANGO_INTEGRATION_ID.calendly && source.status === "ok");
  const calendar = bookingSources.find((source) => source.providerConfigKey === NANGO_INTEGRATION_ID.googleCalendar && source.status === "ok");
  hydration.cards.push({
    key: "booking", title: "Booking", status: calendly ? "ok" : calendar ? "warn"
      : bookingSources.some((source) => source.status === "error") ? "error"
      : bookingSources.some((source) => source.status === "warn") ? "warn" : "disabled",
    value: calendly ? `${calendly.metrics.totalBookings} bookings` : "—",
    meta: { from, to, updatedAt, sources: bookingSources,
      ...(calendly?.metrics ?? {}),
      ...(calendar ? { calendarEvents: calendar.metrics.calendarEvents } : {}),
      // Never combine Calendly and Calendar counts: the same meeting can exist in both.
    },
  });
  return hydration;
}
