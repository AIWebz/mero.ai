import { prisma } from "@/lib/prisma";
import { requireCompanyAccess } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { WebsiteBuilder } from "./website-builder";

export default async function WebsitePage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  await requireCompanyAccess(companyId);

  const website = await prisma.website.findUnique({
    where: { companyId },
    include: { pages: { orderBy: { order: "asc" }, include: { sections: { orderBy: { order: "asc" } } } } },
  });

  if (!website || website.pages.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-sm text-muted">
            Your website hasn&apos;t been built yet.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <WebsiteBuilder
      companyId={companyId}
      pages={website.pages.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        sections: p.sections.map((s) => ({ id: s.id, kind: s.kind, ...JSON.parse(s.contentJson) })),
      }))}
    />
  );
}
