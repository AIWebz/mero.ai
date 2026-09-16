import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiCompanyAccess, apiAuthErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).optional(),
  targetCustomer: z.string().max(500).optional(),
  domain: z.string().max(200).optional(),
  brand: z
    .object({
      tone: z.string().max(200).optional(),
      voice: z.string().max(300).optional(),
      colors: z.array(z.string()).optional(),
    })
    .optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await requireApiCompanyAccess(id);
  } catch (err) {
    return apiAuthErrorResponse(err) ?? NextResponse.json({ error: "Error" }, { status: 500 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid update" }, { status: 400 });

  const { brand, ...companyFields } = parsed.data;

  const company = await prisma.company.update({ where: { id }, data: companyFields });

  if (brand) {
    await prisma.brand.upsert({
      where: { companyId: id },
      update: {
        tone: brand.tone,
        voice: brand.voice,
        ...(brand.colors ? { colorsJson: JSON.stringify(brand.colors) } : {}),
      },
      create: {
        companyId: id,
        tone: brand.tone,
        voice: brand.voice,
        colorsJson: JSON.stringify(brand.colors ?? []),
      },
    });
  }

  return NextResponse.json({ company });
}
