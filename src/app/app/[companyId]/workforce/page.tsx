import { prisma } from "@/lib/prisma";
import { requireCompanyAccess } from "@/lib/session";
import { WorkforceGrid } from "./workforce-grid";

export default async function WorkforcePage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  await requireCompanyAccess(companyId);

  const employees = await prisma.employee.findMany({
    where: { companyId },
    orderBy: { createdAt: "asc" },
    include: {
      tasks: { where: { status: { in: ["pending", "working"] } }, orderBy: { createdAt: "desc" }, take: 1 },
      activities: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workforce</h1>
          <p className="text-sm text-muted">Your AI employees and what they&apos;re working on.</p>
        </div>
      </div>
      <WorkforceGrid
        companyId={companyId}
        employees={employees.map((e) => ({
          id: e.id,
          name: e.name,
          role: e.role,
          kind: e.kind,
          status: e.status,
          goal: e.goal,
          schedule: e.schedule,
          tasksCompleted: e.tasksCompleted,
          permissions: JSON.parse(e.permissionsJson),
          currentTask: e.tasks[0]?.title ?? null,
          lastActivity: e.activities[0]?.summary ?? null,
        }))}
      />
    </div>
  );
}
