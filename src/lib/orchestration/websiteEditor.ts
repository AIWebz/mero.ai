import { prisma } from "@/lib/prisma";
import { getAIProvider, extractJSON } from "@/lib/ai/provider";
import type { WebsiteSection } from "@/lib/ai/companyGenerator";

export interface WebsiteCommandResult {
  ok: boolean;
  message: string;
}

export async function applyWebsiteCommand(
  companyId: string,
  pageId: string,
  command: string,
): Promise<WebsiteCommandResult> {
  const provider = getAIProvider();
  if (!provider.isConnected) {
    return {
      ok: false,
      message: "AI editing isn't connected yet. Add an AI provider API key in Settings, then I can edit this page for you.",
    };
  }

  const page = await prisma.page.findFirstOrThrow({
    where: { id: pageId, website: { companyId } },
    include: { sections: { orderBy: { order: "asc" } } },
  });
  const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });

  const currentSections = page.sections.map((s) => ({
    kind: s.kind,
    ...JSON.parse(s.contentJson),
  }));

  const prompt = `Company: ${company.name} — ${company.description}\n\nCurrent "${page.title}" page sections:\n${JSON.stringify(currentSections, null, 2)}\n\nOwner instruction: "${command}"\n\nRewrite the full sections array to satisfy this instruction. Keep sections that don't need to change. Respond with strict JSON only, an array of:\n{ "kind": "hero"|"features"|"about"|"products"|"contact_form"|"cta"|"text", "heading": string, "body": string, "items"?: string[] }`;

  const text = await provider.complete({
    system: "You are Mero's AI website editor. You make precise, on-brand edits to real website structure. Never add placeholder or lorem ipsum text.",
    prompt,
    maxTokens: 2500,
  });

  const nextSections = extractJSON<WebsiteSection[]>(text);

  await prisma.$transaction([
    prisma.section.deleteMany({ where: { pageId } }),
    prisma.section.createMany({
      data: nextSections.map((s, i) => ({
        pageId,
        kind: s.kind,
        order: i,
        contentJson: JSON.stringify({ heading: s.heading, body: s.body, items: s.items ?? [] }),
      })),
    }),
  ]);

  await prisma.activity.create({
    data: { companyId, summary: `AI Developer updated the "${page.title}" page`, detail: command },
  });
  await prisma.auditLog.create({
    data: { companyId, actor: "AI Developer", action: `Edited "${page.title}" page`, reason: command, result: "success" },
  });

  return { ok: true, message: `Updated the "${page.title}" page.` };
}
