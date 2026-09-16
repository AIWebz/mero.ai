import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiCompanyAccess, apiAuthErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  name: z.string().min(1).max(60),
  role: z.string().min(1).max(120),
  kind: z.enum(["ceo", "sales", "marketing", "support", "research", "analyst", "developer", "operations"]),
  goal: z.string().max(500).optional(),
  schedule: z.string().max(120).optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await requireApiCompanyAccess(id);
  } catch (err) {
    return apiAuthErrorResponse(err) ?? NextResponse.json({ error: "Error" }, { status: 500 });
  }
  const employees = await prisma.employee.findMany({ where: { companyId: id }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ employees });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await requireApiCompanyAccess(id);
  } catch (err) {
    return apiAuthErrorResponse(err) ?? NextResponse.json({ error: "Error" }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid employee" }, { status: 400 });

  const employee = await prisma.employee.create({
    data: {
      companyId: id,
      name: parsed.data.name,
      role: parsed.data.role,
      kind: parsed.data.kind,
      goal: parsed.data.goal,
      schedule: parsed.data.schedule,
      permissionsJson: JSON.stringify({
        read_analytics: true,
        create_content: false,
        publish_content: false,
        spend_money: false,
        send_email: false,
      }),
      toolsJson: JSON.stringify([]),
    },
  });

  await prisma.activity.create({
    data: { companyId: id, employeeId: employee.id, summary: `${employee.name} joined the workforce` },
  });
  await prisma.auditLog.create({
    data: { companyId: id, actor: "owner", action: `Hired ${employee.name} (${employee.role})` },
  });

  return NextResponse.json({ employee });
}
