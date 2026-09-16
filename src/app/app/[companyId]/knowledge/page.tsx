import { prisma } from "@/lib/prisma";
import { requireCompanyAccess } from "@/lib/session";
import { KnowledgeView } from "./knowledge-view";

export default async function KnowledgePage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  await requireCompanyAccess(companyId);

  const [memory, docs] = await Promise.all([
    prisma.companyMemory.findMany({ where: { companyId }, orderBy: { updatedAt: "desc" } }),
    prisma.knowledgeDocument.findMany({ where: { companyId }, orderBy: { updatedAt: "desc" } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Knowledge</h1>
        <p className="text-sm text-muted">What your company — and its AI workforce — knows and remembers.</p>
      </div>
      <KnowledgeView
        companyId={companyId}
        memory={memory.map((m) => ({ id: m.id, key: m.key, category: m.category, content: m.content }))}
        docs={docs.map((d) => ({ id: d.id, title: d.title, category: d.category, content: d.content }))}
      />
    </div>
  );
}
