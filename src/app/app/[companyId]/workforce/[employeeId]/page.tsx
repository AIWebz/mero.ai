import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCompanyAccess } from "@/lib/session";
import { EmployeeDetail } from "./employee-detail";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ companyId: string; employeeId: string }>;
}) {
  const { companyId, employeeId } = await params;
  await requireCompanyAccess(companyId);

  const employee = await prisma.employee.findFirst({ where: { id: employeeId, companyId } });
  if (!employee) notFound();

  const [tasks, activities] = await Promise.all([
    prisma.task.findMany({ where: { employeeId }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.activity.findMany({ where: { employeeId }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  return (
    <EmployeeDetail
      companyId={companyId}
      employee={{
        id: employee.id,
        name: employee.name,
        role: employee.role,
        kind: employee.kind,
        goal: employee.goal,
        schedule: employee.schedule,
        status: employee.status,
        tasksCompleted: employee.tasksCompleted,
        permissions: JSON.parse(employee.permissionsJson),
        tools: JSON.parse(employee.toolsJson),
      }}
      tasks={tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        createdAt: t.createdAt.toISOString(),
        result: t.result,
      }))}
      activities={activities.map((a) => ({ id: a.id, summary: a.summary, createdAt: a.createdAt.toISOString() }))}
    />
  );
}
