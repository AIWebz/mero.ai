import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiCompanyAccess, apiAuthErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ content: z.string().min(1).max(5000) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; memoryId: string }> }) {
  const { id, memoryId } = await params;
  try {
    await requireApiCompanyAccess(id);
  } catch (err) {
    return apiAuthErrorResponse(err) ?? NextResponse.json({ error: "Error" }, { status: 500 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid content" }, { status: 400 });

  await prisma.companyMemory.findFirstOrThrow({ where: { id: memoryId, companyId: id } });
  const entry = await prisma.companyMemory.update({ where: { id: memoryId }, data: { content: parsed.data.content } });
  return NextResponse.json({ entry });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; memoryId: string }> }) {
  const { id, memoryId } = await params;
  try {
    await requireApiCompanyAccess(id);
  } catch (err) {
    return apiAuthErrorResponse(err) ?? NextResponse.json({ error: "Error" }, { status: 500 });
  }
  await prisma.companyMemory.findFirstOrThrow({ where: { id: memoryId, companyId: id } });
  await prisma.companyMemory.delete({ where: { id: memoryId } });
  return NextResponse.json({ ok: true });
}
