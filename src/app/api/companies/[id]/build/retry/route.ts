import { NextResponse } from "next/server";
import { requireApiCompanyAccess, apiAuthErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { runBuild } from "@/lib/orchestration/build";
import type { CompanyProposal } from "@/lib/ai/companyGenerator";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await requireApiCompanyAccess(id);
  } catch (err) {
    return apiAuthErrorResponse(err) ?? NextResponse.json({ error: "Error" }, { status: 500 });
  }

  const company = await prisma.company.findUniqueOrThrow({ where: { id } });
  const proposal = JSON.parse(company.proposalJson) as CompanyProposal;

  await prisma.buildStep.updateMany({
    where: { companyId: id, status: "failed" },
    data: { status: "pending", error: null },
  });

  runBuild(id, proposal).catch((err) => {
    console.error(`Build retry failed for company ${id}:`, err);
  });

  return NextResponse.json({ ok: true });
}
