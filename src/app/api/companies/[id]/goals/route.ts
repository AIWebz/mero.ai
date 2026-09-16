import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiCompanyAccess, apiAuthErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ title: z.string().min(1).max(200), description: z.string().max(1000).optional() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await requireApiCompanyAccess(id);
  } catch (err) {
    return apiAuthErrorResponse(err) ?? NextResponse.json({ error: "Error" }, { status: 500 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid goal" }, { status: 400 });

  const goal = await prisma.goal.create({ data: { companyId: id, title: parsed.data.title, description: parsed.data.description } });
  return NextResponse.json({ goal });
}
