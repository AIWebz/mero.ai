import { prisma } from "@/lib/prisma";
import { requireCompanyAccess } from "@/lib/session";
import { ApprovalsView } from "./approvals-view";

export default async function ApprovalsPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  await requireCompanyAccess(companyId);

  const approvals = await prisma.approval.findMany({
    where: { companyId },
    include: { task: { include: { employee: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Approvals</h1>
        <p className="text-sm text-muted">Sensitive actions wait here until you approve or reject them.</p>
      </div>
      <ApprovalsView
        companyId={companyId}
        approvals={approvals.map((a) => ({
          id: a.id,
          title: a.title,
          reason: a.reason,
          impact: a.impact,
          risk: a.risk,
          status: a.status,
          createdAt: a.createdAt.toISOString(),
          employeeName: a.task.employee?.name ?? "AI CEO",
        }))}
      />
    </div>
  );
}
