import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiCompanyAccess, apiAuthErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  aiAutonomyLevel: z.enum(["supervised", "autonomous_low_risk", "autonomous_full"]).optional(),
  timezone: z.string().max(80).optional(),
  notifyEmail: z.string().email().optional().or(z.literal("")),
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
  if (!parsed.success) return NextResponse.json({ error: "Invalid settings" }, { status: 400 });

  const settings = await prisma.companySettings.upsert({
    where: { companyId: id },
    update: parsed.data,
    create: { companyId: id, ...parsed.data },
  });
  return NextResponse.json({ settings });
}
