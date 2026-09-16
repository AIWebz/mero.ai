import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiCompanyAccess, apiAuthErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  kind: z.enum(["hero", "features", "about", "products", "contact_form", "cta", "text"]),
  heading: z.string().max(300).default(""),
  body: z.string().max(3000).default(""),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string; pageId: string }> }) {
  const { id, pageId } = await params;
  try {
    await requireApiCompanyAccess(id);
  } catch (err) {
    return apiAuthErrorResponse(err) ?? NextResponse.json({ error: "Error" }, { status: 500 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid section" }, { status: 400 });

  const page = await prisma.page.findFirstOrThrow({ where: { id: pageId, website: { companyId: id } }, include: { sections: true } });

  const section = await prisma.section.create({
    data: {
      pageId,
      kind: parsed.data.kind,
      order: page.sections.length,
      contentJson: JSON.stringify({ heading: parsed.data.heading, body: parsed.data.body, items: [] }),
    },
  });
  return NextResponse.json({ section });
}
