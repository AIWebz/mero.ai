import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiCompanyAccess, apiAuthErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await requireApiCompanyAccess(id);
  } catch (err) {
    return apiAuthErrorResponse(err) ?? NextResponse.json({ error: "Error" }, { status: 500 });
  }
  const entries = await prisma.companyMemory.findMany({ where: { companyId: id }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ entries });
}

const schema = z.object({
  key: z.string().min(1).max(120),
  category: z.enum(["general", "policy", "customer", "decision", "event"]).default("general"),
  content: z.string().min(1).max(5000),
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
  if (!parsed.success) return NextResponse.json({ error: "Invalid entry" }, { status: 400 });

  const entry = await prisma.companyMemory.upsert({
    where: { companyId_key: { companyId: id, key: parsed.data.key } },
    update: { content: parsed.data.content, category: parsed.data.category },
    create: { companyId: id, key: parsed.data.key, category: parsed.data.category, content: parsed.data.content },
  });
  return NextResponse.json({ entry });
}
