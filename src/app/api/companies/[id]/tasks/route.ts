import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiCompanyAccess, apiAuthErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { runTask } from "@/lib/orchestration/taskRunner";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await requireApiCompanyAccess(id);
  } catch (err) {
    return apiAuthErrorResponse(err) ?? NextResponse.json({ error: "Error" }, { status: 500 });
  }

  const tasks = await prisma.task.findMany({
    where: { companyId: id },
    include: { employee: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ tasks });
}

const schema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  employeeId: z.string().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await requireApiCompanyAccess(id);
  } catch (err) {
    return apiAuthErrorResponse(err) ?? NextResponse.json({ error: "Error" }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid task" }, { status: 400 });

  const task = await prisma.task.create({
    data: {
      companyId: id,
      employeeId: parsed.data.employeeId || null,
      title: parsed.data.title,
      description: parsed.data.description,
      priority: parsed.data.priority,
      status: "pending",
    },
  });

  runTask(task.id).catch(() => {});

  return NextResponse.json({ task });
}
