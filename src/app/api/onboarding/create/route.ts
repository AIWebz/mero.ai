import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initBuildSteps, runBuild } from "@/lib/orchestration/build";
import type { CompanyProposal } from "@/lib/ai/companyGenerator";

const proposalSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().min(1).max(2000),
  industry: z.string().min(1).max(120),
  businessModel: z.string().min(1).max(120),
  targetCustomer: z.string().min(1).max(500),
  products: z.array(z.string()).min(1).max(20),
  pricingStrategy: z.string().min(1).max(500),
  brandPersonality: z.array(z.string()).min(1).max(10),
  brandTone: z.string().min(1).max(200),
  brandVoice: z.string().min(1).max(300),
  brandColors: z.array(z.string()).min(1).max(6),
  suggestedDomain: z.string().min(1).max(200),
  goals: z.array(z.string()).min(1).max(10),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = proposalSchema.safeParse(body?.proposal);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid business plan" }, { status: 400 });
  }
  const proposal = parsed.data as CompanyProposal;

  const company = await prisma.company.create({
    data: {
      name: proposal.name,
      description: proposal.description,
      industry: proposal.industry,
      businessModel: proposal.businessModel,
      targetCustomer: proposal.targetCustomer,
      domain: proposal.suggestedDomain,
      status: "building",
      proposalJson: JSON.stringify(proposal),
      members: { create: { userId: session.user.id, role: "owner" } },
    },
  });

  await initBuildSteps(company.id);

  // Fire-and-forget: the client polls /api/companies/[id]/build-steps for real progress.
  runBuild(company.id, proposal).catch(async (err) => {
    console.error(`Build failed for company ${company.id}:`, err);
  });

  return NextResponse.json({ companyId: company.id });
}
