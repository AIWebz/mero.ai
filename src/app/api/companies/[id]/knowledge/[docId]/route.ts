import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiCompanyAccess, apiAuthErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ title: z.string().min(1).max(200).optional(), content: z.string().min(1).max(10000).optional() });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const { id, docId } = await params;
  try {
    await requireApiCompanyAccess(id);
  } catch (err) {
    return apiAuthErrorResponse(err) ?? NextResponse.json({ error: "Error" }, { status: 500 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid update" }, { status: 400 });

  await prisma.knowledgeDocument.findFirstOrThrow({ where: { id: docId, companyId: id } });
  const doc = await prisma.knowledgeDocument.update({ where: { id: docId }, data: parsed.data });
  return NextResponse.json({ doc });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const { id, docId } = await params;
  try {
    await requireApiCompanyAccess(id);
  } catch (err) {
    return apiAuthErrorResponse(err) ?? NextResponse.json({ error: "Error" }, { status: 500 });
  }
  await prisma.knowledgeDocument.findFirstOrThrow({ where: { id: docId, companyId: id } });
  await prisma.knowledgeDocument.delete({ where: { id: docId } });
  return NextResponse.json({ ok: true });
}
