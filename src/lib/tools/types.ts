/**
 * The tool abstraction AI employees act through. An employee's `toolsJson` field stores the ids
 * of tools it may use (see Employee model); this registry is the architecture those ids resolve
 * against. Browser/CRM/Payments execution isn't implemented yet — see `status` below — but every
 * employee action still goes through a permission check before a tool call is attempted, which is
 * what makes adding real execution later additive rather than a rewrite.
 */
export type ToolCategory = "browser" | "email" | "calendar" | "crm" | "database" | "website" | "analytics" | "payments";

export interface ToolDefinition {
  id: string;
  category: ToolCategory;
  label: string;
  description: string;
  status: "available" | "coming_soon";
  requiredPermission: string;
}

export const TOOL_REGISTRY: ToolDefinition[] = [
  { id: "browser", category: "browser", label: "Browser", description: "Operate web-based software on the company's behalf.", status: "coming_soon", requiredPermission: "create_content" },
  { id: "email", category: "email", label: "Email", description: "Send and read email.", status: "coming_soon", requiredPermission: "send_email" },
  { id: "calendar", category: "calendar", label: "Calendar", description: "Schedule and manage meetings.", status: "coming_soon", requiredPermission: "read_analytics" },
  { id: "crm", category: "crm", label: "CRM", description: "Read and update leads and deals.", status: "coming_soon", requiredPermission: "create_content" },
  { id: "database", category: "database", label: "Database", description: "Read and write company records.", status: "available", requiredPermission: "read_analytics" },
  { id: "website", category: "website", label: "Website", description: "Edit the company website's structure and copy.", status: "available", requiredPermission: "create_content" },
  { id: "analytics", category: "analytics", label: "Analytics", description: "Read traffic, conversion, and revenue data.", status: "coming_soon", requiredPermission: "read_analytics" },
  { id: "payments", category: "payments", label: "Payments", description: "Process charges and refunds.", status: "coming_soon", requiredPermission: "spend_money" },
];

/**
 * Every tool call an AI employee makes must go through here first. Actual execution for
 * `coming_soon` tools isn't implemented — this only enforces the permission gate, matching the
 * product principle that an employee never gets unrestricted access to the company.
 */
export function canUseTool(toolId: string, permissions: Record<string, boolean>): boolean {
  const tool = TOOL_REGISTRY.find((t) => t.id === toolId);
  if (!tool) return false;
  return !!permissions[tool.requiredPermission];
}
