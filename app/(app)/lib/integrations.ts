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