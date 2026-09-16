import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { generateCompanyProposal } from "@/lib/ai/companyGenerator";

const schema = z.object({ idea: z.string().min(10).max(2000) });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please describe your idea in a bit more detail." }, { status: 400 });
  }

  const { proposal, source } = await generateCompanyProposal(parsed.data.idea);
  return NextResponse.json({ proposal, source });
}
