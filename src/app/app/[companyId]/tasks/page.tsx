import { prisma } from "@/lib/prisma";
import { requireCompanyAccess } from "@/lib/session";
import { TasksView } from "./tasks-view";

export default async function TasksPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  await requireCompanyAccess(companyId);

  const [tasks, employees] = await Promise.all([
    prisma.task.findMany({
      where: { companyId },
      include: { employee: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.employee.findMany({ where: { companyId, status: "active" }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        <p className="text-sm text-muted">Everything your AI workforce is doing, has done, or is waiting on.</p>
      </div>
      <TasksView
        companyId={companyId}
        employees={employees.map((e) => ({ id: e.id, name: e.name }))}
        tasks={tasks.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          result: t.result,
          createdAt: t.createdAt.toISOString(),
          employeeName: t.employee?.name ?? null,
        }))}
      />
    </div>
  );
}
