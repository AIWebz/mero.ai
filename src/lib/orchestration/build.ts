import { prisma } from "@/lib/prisma";
import type { CompanyProposal } from "@/lib/ai/companyGenerator";
import { designWorkforce, generateWebsite, generateKnowledgeBase } from "@/lib/ai/companyGenerator";
import { INTEGRATION_CATALOG } from "@/lib/integrations/catalog";

export const BUILD_STEPS: { key: string; label: string }[] = [
  { key: "understanding_idea", label: "Understanding business idea" },
  { key: "defining_customer", label: "Defining target customer" },
  { key: "creating_structure", label: "Creating business structure" },
  { key: "creating_brand", label: "Creating brand" },
  { key: "planning_website", label: "Planning website" },
  { key: "creating_website", label: "Creating website" },
  { key: "designing_workforce", label: "Designing AI workforce" },
  { key: "configuring_memory", label: "Configuring company memory" },
  { key: "preparing_launch", label: "Preparing launch" },
];

export async function initBuildSteps(companyId: string) {
  await prisma.buildStep.createMany({
    data: BUILD_STEPS.map((s, i) => ({ companyId, key: s.key, label: s.label, order: i, status: "pending" })),
  });
}

async function runStep(companyId: string, key: string, work: () => Promise<void>) {
  const step = await prisma.buildStep.findUniqueOrThrow({ where: { companyId_key: { companyId, key } } });
  if (step.status === "completed") return;

  await prisma.buildStep.update({ where: { id: step.id }, data: { status: "running", startedAt: new Date() } });
  try {
    await work();
    await prisma.buildStep.update({ where: { id: step.id }, data: { status: "completed", completedAt: new Date() } });
  } catch (err) {
    await prisma.buildStep.update({
      where: { id: step.id },
      data: { status: "failed", error: err instanceof Error ? err.message : "Unknown error" },
    });
    throw err;
  }
}

/**
 * Runs the company build sequence. Idempotent — steps already completed are skipped, so this can
 * be safely re-invoked to retry after a failure. Executes in-process; a production deployment
 * with multiple server instances would move this to a real job queue instead of fire-and-forget.
 */
export async function runBuild(companyId: string, proposal: CompanyProposal): Promise<void> {
  await runStep(companyId, "understanding_idea", async () => {
    const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });
    if (!company.name || !company.description) throw new Error("Missing core business fields");
  });

  await runStep(companyId, "defining_customer", async () => {
    await prisma.goal.createMany({
      data: proposal.goals.map((title) => ({ companyId, title })),
    });
  });

  await runStep(companyId, "creating_structure", async () => {
    await prisma.companySettings.upsert({
      where: { companyId },
      update: {},
      create: { companyId },
    });
  });

  await runStep(companyId, "creating_brand", async () => {
    await prisma.brand.upsert({
      where: { companyId },
      update: {
        tone: proposal.brandTone,
        voice: proposal.brandVoice,
        colorsJson: JSON.stringify(proposal.brandColors),
      },
      create: {
        companyId,
        tone: proposal.brandTone,
        voice: proposal.brandVoice,
        colorsJson: JSON.stringify(proposal.brandColors),
        logoText: proposal.name,
      },
    });
  });

  let websitePlan: Awaited<ReturnType<typeof generateWebsite>>["pages"] | null = null;
  let websiteSource: "ai" | "template" = "template";
  await runStep(companyId, "planning_website", async () => {
    const { pages, source } = await generateWebsite(proposal);
    websitePlan = pages;
    websiteSource = source;
  });

  await runStep(companyId, "creating_website", async () => {
    if (!websitePlan) throw new Error("Website plan missing");
    const website = await prisma.website.upsert({
      where: { companyId },
      update: {},
      create: { companyId },
    });
    for (let i = 0; i < websitePlan.length; i++) {
      const p = websitePlan[i];
      const page = await prisma.page.upsert({
        where: { websiteId_slug: { websiteId: website.id, slug: p.slug } },
        update: { title: p.title, seoTitle: p.seoTitle, seoDescription: p.seoDescription, order: i },
        create: {
          websiteId: website.id,
          slug: p.slug,
          title: p.title,
          seoTitle: p.seoTitle,
          seoDescription: p.seoDescription,
          order: i,
        },
      });
      await prisma.section.deleteMany({ where: { pageId: page.id } });
      await prisma.section.createMany({
        data: p.sections.map((s, si) => ({
          pageId: page.id,
          kind: s.kind,
          order: si,
          contentJson: JSON.stringify({ heading: s.heading, body: s.body, items: s.items ?? [] }),
        })),
      });
    }
    await prisma.auditLog.create({
      data: {
        companyId,
        actor: "AI Developer",
        action: `Built website (${websitePlan.length} pages)`,
        reason: websiteSource === "ai" ? "Generated by AI from business plan" : "Generated from default template (AI not connected)",
      },
    });
  });

  await runStep(companyId, "designing_workforce", async () => {
    const { employees, source } = await designWorkforce(proposal);
    for (const e of employees) {
      await prisma.employee.create({
        data: {
          companyId,
          name: e.name,
          role: e.role,
          kind: e.kind,
          goal: e.goal,
          schedule: e.schedule,
          permissionsJson: JSON.stringify(e.permissions),
          toolsJson: JSON.stringify(e.tools),
        },
      });
    }
    await prisma.activity.create({
      data: {
        companyId,
        summary: `AI CEO assembled the workforce (${employees.length} employees)`,
        detail: source === "ai" ? "Chosen by AI for this business" : "Chosen from default template (AI not connected)",
      },
    });
  });

  await runStep(companyId, "configuring_memory", async () => {
    const { docs } = await generateKnowledgeBase(proposal);
    await prisma.knowledgeDocument.createMany({
      data: docs.map((d) => ({ companyId, title: d.title, category: d.category, content: d.content })),
    });
    const memoryEntries: { key: string; category: string; content: string }[] = [
      { key: "business_overview", category: "general", content: proposal.description },
      { key: "target_customer", category: "customer", content: proposal.targetCustomer },
      { key: "brand_voice", category: "general", content: `${proposal.brandTone} — ${proposal.brandVoice}` },
      { key: "pricing_strategy", category: "policy", content: proposal.pricingStrategy },
    ];
    for (const m of memoryEntries) {
      await prisma.companyMemory.upsert({
        where: { companyId_key: { companyId, key: m.key } },
        update: { content: m.content, category: m.category },
        create: { companyId, key: m.key, category: m.category, content: m.content },
      });
    }
  });

  await runStep(companyId, "preparing_launch", async () => {
    for (const def of INTEGRATION_CATALOG) {
      await prisma.integration.upsert({
        where: { companyId_provider: { companyId, provider: def.provider } },
        update: {},
        create: { companyId, provider: def.provider, category: def.category, status: "not_connected" },
      });
    }
    await prisma.company.update({ where: { id: companyId }, data: { status: "active" } });
    await prisma.auditLog.create({
      data: { companyId, actor: "system", action: "Company launched", result: "success" },
    });
    await prisma.activity.create({
      data: { companyId, summary: `${proposal.name} launched` },
    });
  });
}
