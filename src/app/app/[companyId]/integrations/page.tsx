import { prisma } from "@/lib/prisma";
import { requireCompanyAccess } from "@/lib/session";
import { INTEGRATION_CATALOG } from "@/lib/integrations/catalog";
import { IntegrationsView } from "./integrations-view";

const CATEGORY_LABEL: Record<string, string> = {
  communication: "Communication",
  business: "Business",
  analytics: "Analytics",
  productivity: "Productivity",
};

export default async function IntegrationsPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  await requireCompanyAccess(companyId);

  const integrations = await prisma.integration.findMany({ where: { companyId } });
  const statusByProvider = new Map(integrations.map((i) => [i.provider, i.status]));

  const grouped = INTEGRATION_CATALOG.reduce<Record<string, typeof INTEGRATION_CATALOG>>((acc, def) => {
    acc[def.category] = acc[def.category] ?? [];
    acc[def.category].push(def);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
        <p className="text-sm text-muted">
          Connect real data sources and tools so your AI workforce can act on real information.
        </p>
      </div>

      {Object.entries(grouped).map(([category, defs]) => (
        <div key={category}>
          <h2 className="mb-3 text-sm font-semibold text-muted">{CATEGORY_LABEL[category] ?? category}</h2>
          <IntegrationsView
            items={defs.map((d) => ({
              provider: d.provider,
              name: d.name,
              description: d.description,
              status: statusByProvider.get(d.provider) ?? "not_connected",
            }))}
          />
        </div>
      ))}
    </div>
  );
}
