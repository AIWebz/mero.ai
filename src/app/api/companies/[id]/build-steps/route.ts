import { NextResponse } from "next/server";
import { requireApiCompanyAccess, apiAuthErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await requireApiCompanyAccess(id);
  } catch (err) {
    return apiAuthErrorResponse(err) ?? NextResponse.json({ error: "Error" }, { status: 500 });
  }

  const [steps, company] = await Promise.all([
    prisma.buildStep.findMany({ where: { companyId: id }, orderBy: { order: "asc" } }),
    prisma.company.findUniqueOrThrow({ where: { id } }),
  ]);

  return NextResponse.json({ steps, status: company.status });
}
