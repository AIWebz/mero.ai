import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiCompanyAccess, apiAuthErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  heading: z.string().max(300).optional(),
  body: z.string().max(3000).optional(),
  items: z.array(z.string()).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; pageId: string; sectionId: string }> },
) {
  const { id, sectionId } = await params;
  try {
    await requireApiCompanyAccess(id);
  } catch (err) {
    return apiAuthErrorResponse(err) ?? NextResponse.json({ error: "Error" }, { status: 500 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid section" }, { status: 400 });

  const section = await prisma.section.findFirstOrThrow({
    where: { id: sectionId, page: { website: { companyId: id } } },
  });
  const current = JSON.parse(section.contentJson);
  const next = { ...current, ...parsed.data };

  const updated = await prisma.section.update({ where: { id: sectionId }, data: { contentJson: JSON.stringify(next) } });
  return NextResponse.json({ section: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; pageId: string; sectionId: string }> },
) {
  const { id, sectionId } = await params;
  try {
    await requireApiCompanyAccess(id);
  } catch (err) {
    return apiAuthErrorResponse(err) ?? NextResponse.json({ error: "Error" }, { status: 500 });
  }
  await prisma.section.findFirstOrThrow({ where: { id: sectionId, page: { website: { companyId: id } } } });
  await prisma.section.delete({ where: { id: sectionId } });
  return NextResponse.json({ ok: true });
}
