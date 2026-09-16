import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiCompanyAccess, apiAuthErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ status: z.enum(["active", "achieved", "dropped"]) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; goalId: string }> }) {
  const { id, goalId } = await params;
  try {
    await requireApiCompanyAccess(id);
  } catch (err) {
    return apiAuthErrorResponse(err) ?? NextResponse.json({ error: "Error" }, { status: 500 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid update" }, { status: 400 });

  await prisma.goal.findFirstOrThrow({ where: { id: goalId, companyId: id } });
  const goal = await prisma.goal.update({ where: { id: goalId }, data: { status: parsed.data.status } });
  return NextResponse.json({ goal });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; goalId: string }> }) {
  const { id, goalId } = await params;
  try {
    await requireApiCompanyAccess(id);
  } catch (err) {
    return apiAuthErrorResponse(err) ?? NextResponse.json({ error: "Error" }, { status: 500 });
  }
  await prisma.goal.findFirstOrThrow({ where: { id: goalId, companyId: id } });
  await prisma.goal.delete({ where: { id: goalId } });
  return NextResponse.json({ ok: true });
}
