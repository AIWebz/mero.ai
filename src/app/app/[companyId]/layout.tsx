import { requireCompanyAccess } from "@/lib/session";
import { getUserCompanies } from "@/lib/companies";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";

export default async function CompanyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const { user } = await requireCompanyAccess(companyId);

  const [companies, company, pendingApprovals] = await Promise.all([
    getUserCompanies(user.id),
    prisma.company.findUniqueOrThrow({ where: { id: companyId } }),
    prisma.approval.count({ where: { companyId, status: "pending" } }),
  ]);

  return (
    <AppShell
      companies={companies.map((c) => ({ id: c.id, name: c.name, status: c.status }))}
      currentCompany={{ id: company.id, name: company.name }}
      userName={user.name ?? user.email ?? "Account"}
      pendingApprovals={pendingApprovals}
    >
      {children}
    </AppShell>
  );
}
