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
  const docs = await prisma.knowledgeDocument.findMany({ where: { companyId: id }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ docs });
}

const schema = z.object({
  title: z.string().min(1).max(200),
  category: z.enum(["business_plan", "marketing", "sales", "support", "general"]).default("general"),
  content: z.string().min(1).max(10000),
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
  if (!parsed.success) return NextResponse.json({ error: "Invalid document" }, { status: 400 });

  const doc = await prisma.knowledgeDocument.create({
    data: { companyId: id, title: parsed.data.title, category: parsed.data.category, content: parsed.data.content },
  });
  return NextResponse.json({ doc });
}
