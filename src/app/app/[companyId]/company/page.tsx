import { prisma } from "@/lib/prisma";
import { requireCompanyAccess } from "@/lib/session";
import { CompanyView } from "./company-view";

export default async function CompanyPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  await requireCompanyAccess(companyId);

  const [company, brand, goals] = await Promise.all([
    prisma.company.findUniqueOrThrow({ where: { id: companyId } }),
    prisma.brand.findUnique({ where: { companyId } }),
    prisma.goal.findMany({ where: { companyId }, orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Company</h1>
        <p className="text-sm text-muted">Your company&apos;s profile, brand, and goals.</p>
      </div>
      <CompanyView
        companyId={companyId}
        company={{
          name: company.name,
          description: company.description ?? "",
          industry: company.industry ?? "",
          businessModel: company.businessModel ?? "",
          targetCustomer: company.targetCustomer ?? "",
          domain: company.domain ?? "",
        }}
        brand={{
          tone: brand?.tone ?? "",
          voice: brand?.voice ?? "",
          colors: brand ? (JSON.parse(brand.colorsJson) as string[]) : [],
        }}
        goals={goals.map((g) => ({ id: g.id, title: g.title, status: g.status }))}
      />
    </div>
  );
}
