export type IntegrationKey =
  | "brevo"
  | "calendly"
  | "google"
  | "googleAds"
  | "googleCalendar"
  | "hubspot"
  | "meta"
  | "notion"
  | "quickbooks"
  | "salesforce"
  | "shopify"
  | "slack"
  | "stripe"
  | "woocommerce"
  | "github";

export const NANGO_INTEGRATION_ID: Record<IntegrationKey, string> = {
  brevo: "brevo-api-key",
  calendly: "calendly",
  google: "google-analytics",
  googleAds: "google-ads",
  googleCalendar: "google-calendar",
  hubspot: "hubspot",
  meta: "meta-marketing-api",
  notion: "notion",
  quickbooks: "quickbooks",
  salesforce: "salesforce",
  shopify: "shopify",
  slack: "slack",
  stripe: "stripe-api-key",
  woocommerce: "woocommerce",
  github: "github-app",
};

export const INTEGRATION_LABELS: Record<IntegrationKey, string> = {
  brevo: "Brevo",
  calendly: "Calendly",
  google: "Google Analytics",
  googleAds: "Google Ads",
  googleCalendar: "Google Calendar",
  hubspot: "HubSpot",
  meta: "Meta Ads",
  notion: "Notion",
  quickbooks: "QuickBooks",
  salesforce: "Salesforce",
  shopify: "Shopify",
  slack: "Slack",
  stripe: "Stripe",
  woocommerce: "WooCommerce",
  github: "GitHub",
};

export const INTEGRATION_DEFINITIONS = (
  Object.keys(NANGO_INTEGRATION_ID) as IntegrationKey[]
).map((key) => ({
  key,
  label: INTEGRATION_LABELS[key],
  providerConfigKey: NANGO_INTEGRATION_ID[key],
}));