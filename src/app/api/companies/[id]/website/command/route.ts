import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiCompanyAccess, apiAuthErrorResponse } from "@/lib/api-auth";
import { applyWebsiteCommand } from "@/lib/orchestration/websiteEditor";

const schema = z.object({ pageId: z.string().min(1), command: z.string().min(1).max(1000) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await requireApiCompanyAccess(id);
  } catch (err) {
    return apiAuthErrorResponse(err) ?? NextResponse.json({ error: "Error" }, { status: 500 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid command" }, { status: 400 });

  const result = await applyWebsiteCommand(id, parsed.data.pageId, parsed.data.command);
  return NextResponse.json(result);
}
