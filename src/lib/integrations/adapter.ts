/**
 * The adapter contract every integration must implement once it's actually wired up.
 * Nothing in this codebase implements this yet — see INTEGRATION_CATALOG and the
 * Integrations page, which show every provider as `not_connected` until a real OAuth/API
 * key exchange is built for it. This interface exists so that work is additive: implement
 * it for a provider, register it below, and the rest of the app (metrics, tools, the
 * Connect button) picks it up without further changes.
 */
export interface IntegrationAdapter {
  provider: string;

  /** Starts an OAuth/API-key exchange and returns a URL to redirect the owner to, or null if none is needed. */
  connect(companyId: string): Promise<{ redirectUrl: string | null }>;

  /** Tears down stored credentials and marks the integration not_connected. */
  disconnect(companyId: string): Promise<void>;

  /** Pulls the latest metrics this integration can provide (e.g. revenue, traffic) into MetricSnapshot rows. */
  syncMetrics?(companyId: string): Promise<void>;
}

/** No adapters are registered yet — every provider in the catalog is not_connected. */
export const INTEGRATION_ADAPTERS: Record<string, IntegrationAdapter> = {};
