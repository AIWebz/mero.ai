import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiCompanyAccess, apiAuthErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  goal: z.string().max(500).optional(),
  schedule: z.string().max(120).optional(),
  status: z.enum(["active", "paused"]).optional(),
  permissions: z
    .object({
      read_analytics: z.boolean(),
      create_content: z.boolean(),
      publish_content: z.boolean(),
      spend_money: z.boolean(),
      send_email: z.boolean(),
    })
    .partial()
    .optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; employeeId: string }> }) {
  const { id, employeeId } = await params;
  try {
    await requireApiCompanyAccess(id);
  } catch (err) {
    return apiAuthErrorResponse(err) ?? NextResponse.json({ error: "Error" }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid update" }, { status: 400 });

  const employee = await prisma.employee.findFirstOrThrow({ where: { id: employeeId, companyId: id } });
  const currentPermissions = JSON.parse(employee.permissionsJson);
  const nextPermissions = parsed.data.permissions
    ? { ...currentPermissions, ...parsed.data.permissions }
    : currentPermissions;

  const updated = await prisma.employee.update({
    where: { id: employeeId },
    data: {
      goal: parsed.data.goal ?? employee.goal,
      schedule: parsed.data.schedule ?? employee.schedule,
      status: parsed.data.status ?? employee.status,
      permissionsJson: JSON.stringify(nextPermissions),
    },
  });

  if (parsed.data.status && parsed.data.status !== employee.status) {
    await prisma.auditLog.create({
      data: { companyId: id, actor: "owner", action: `${parsed.data.status === "paused" ? "Paused" : "Resumed"} ${employee.name}` },
    });
  }
  if (parsed.data.permissions) {
    await prisma.auditLog.create({
      data: { companyId: id, actor: "owner", action: `Updated permissions for ${employee.name}`, metaJson: JSON.stringify(parsed.data.permissions) },
    });
  }

  return NextResponse.json({ employee: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; employeeId: string }> }) {
  const { id, employeeId } = await params;
  try {
    await requireApiCompanyAccess(id);
  } catch (err) {
    return apiAuthErrorResponse(err) ?? NextResponse.json({ error: "Error" }, { status: 500 });
  }

  const employee = await prisma.employee.findFirstOrThrow({ where: { id: employeeId, companyId: id } });
  await prisma.employee.delete({ where: { id: employeeId } });
  await prisma.auditLog.create({ data: { companyId: id, actor: "owner", action: `Removed ${employee.name} from the workforce` } });

  return NextResponse.json({ ok: true });
}
