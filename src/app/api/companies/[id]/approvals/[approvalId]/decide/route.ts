import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiCompanyAccess, apiAuthErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { runApprovedTask } from "@/lib/orchestration/taskRunner";

const schema = z.object({ decision: z.enum(["approved", "rejected"]) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string; approvalId: string }> }) {
  const { id, approvalId } = await params;
  let user;
  try {
    ({ user } = await requireApiCompanyAccess(id));
  } catch (err) {
    return apiAuthErrorResponse(err) ?? NextResponse.json({ error: "Error" }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid decision" }, { status: 400 });

  const approval = await prisma.approval.findFirstOrThrow({ where: { id: approvalId, companyId: id }, include: { task: true } });

  await prisma.approval.update({
    where: { id: approvalId },
    data: { status: parsed.data.decision, decidedById: user.id, decidedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      companyId: id,
      actor: "owner",
      action: `${parsed.data.decision === "approved" ? "Approved" : "Rejected"} "${approval.title}"`,
      result: "success",
    },
  });

  if (parsed.data.decision === "approved") {
    await prisma.task.update({ where: { id: approval.taskId }, data: { status: "pending" } });
    runApprovedTask(approval.taskId).catch(() => {});
  } else {
    await prisma.task.update({ where: { id: approval.taskId }, data: { status: "cancelled" } });
  }

  return NextResponse.json({ ok: true });
}
