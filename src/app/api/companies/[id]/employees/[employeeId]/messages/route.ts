import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiCompanyAccess, apiAuthErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { sendEmployeeMessage } from "@/lib/orchestration/employeeChat";

async function getOrCreateConversation(companyId: string, employeeId: string) {
  const existing = await prisma.conversation.findFirst({ where: { companyId, employeeId }, orderBy: { createdAt: "desc" } });
  if (existing) return existing;
  return prisma.conversation.create({ data: { companyId, employeeId } });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; employeeId: string }> }) {
  const { id, employeeId } = await params;
  try {
    await requireApiCompanyAccess(id);
  } catch (err) {
    return apiAuthErrorResponse(err) ?? NextResponse.json({ error: "Error" }, { status: 500 });
  }

  const conversation = await getOrCreateConversation(id, employeeId);
  const messages = await prisma.message.findMany({ where: { conversationId: conversation.id }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ messages });
}

const schema = z.object({ message: z.string().min(1).max(4000) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string; employeeId: string }> }) {
  const { id, employeeId } = await params;
  try {
    await requireApiCompanyAccess(id);
  } catch (err) {
    return apiAuthErrorResponse(err) ?? NextResponse.json({ error: "Error" }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Message required" }, { status: 400 });

  const conversation = await getOrCreateConversation(id, employeeId);
  const reply = await sendEmployeeMessage(conversation.id, parsed.data.message);

  return NextResponse.json({ reply });
}
