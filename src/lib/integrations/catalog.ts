export interface IntegrationDefinition {
  provider: string;
  category: "communication" | "business" | "analytics" | "productivity";
  name: string;
  description: string;
}

/**
 * The full catalog of integrations Mero knows how to model. None of these are actually wired to
 * a live OAuth flow yet — every company starts with each of these as `not_connected`, and the
 * Integrations page is the single place that can change that (see lib/integrations/adapter.ts).
 */
export const INTEGRATION_CATALOG: IntegrationDefinition[] = [
  { provider: "gmail", category: "communication", name: "Gmail", description: "Send and read email on the company's behalf." },
  { provider: "outlook", category: "communication", name: "Outlook", description: "Send and read email on the company's behalf." },
  { provider: "sms", category: "communication", name: "SMS", description: "Send text messages to customers and leads." },
  { provider: "phone", category: "communication", name: "Phone", description: "Place and receive calls." },
  { provider: "stripe", category: "business", name: "Stripe", description: "Payments, subscriptions, and revenue data." },
  { provider: "shopify", category: "business", name: "Shopify", description: "Store, orders, and product catalog." },
  { provider: "crm", category: "business", name: "CRM", description: "Leads, deals, and customer records." },
  { provider: "calendar", category: "business", name: "Calendar", description: "Scheduling and meeting management." },
  { provider: "google_analytics", category: "analytics", name: "Google Analytics", description: "Website traffic and behavior data." },
  { provider: "search_console", category: "analytics", name: "Search Console", description: "Search performance and indexing." },
  { provider: "google_drive", category: "productivity", name: "Google Drive", description: "Documents and file storage." },
  { provider: "slack", category: "productivity", name: "Slack", description: "Team notifications and approvals." },
];
