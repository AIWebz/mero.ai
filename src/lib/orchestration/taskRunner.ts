import { prisma } from "@/lib/prisma";
import { getAIProvider } from "@/lib/ai/provider";

const SENSITIVE_KEYWORDS: Record<string, string> = {
  publish_content: "publish|post publicly|go live|ship to production",
  spend_money: "spend|budget|purchase|buy ads|pay for",
  send_email: "send (to|the)|email (customers|leads|the list)|blast",
};

function taskNeedsApproval(taskText: string, permissions: Record<string, boolean>): { needs: boolean; reason?: string } {
  for (const [permission, pattern] of Object.entries(SENSITIVE_KEYWORDS)) {
    if (permissions[permission]) continue; // already allowed
    if (new RegExp(pattern, "i").test(taskText)) {
      return { needs: true, reason: `Requires "${permission}" permission, which is not currently granted.` };
    }
  }
  return { needs: false };
}

export async function runTask(taskId: string): Promise<void> {
  const task = await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
    include: { employee: true, company: true },
  });

  await prisma.task.update({ where: { id: taskId }, data: { status: "working", startedAt: new Date() } });

  const provider = getAIProvider();
  if (!provider.isConnected) {
    await prisma.task.update({
      where: { id: taskId },
      data: { status: "failed", result: "AI provider not connected. Add an API key in Settings to run this task." },
    });
    await prisma.auditLog.create({
      data: {
        companyId: task.companyId,
        actor: task.employee?.name ?? "system",
        action: `Attempted task "${task.title}"`,
        result: "failure",
        reason: "AI provider not connected",
      },
    });
    return;
  }

  const permissions: Record<string, boolean> = task.employee
    ? JSON.parse(task.employee.permissionsJson)
    : {};
  const taskText = `${task.title} ${task.description ?? ""}`;
  const approvalCheck = taskNeedsApproval(taskText, permissions);

  if (approvalCheck.needs) {
    await prisma.$transaction([
      prisma.task.update({ where: { id: taskId }, data: { status: "awaiting_approval", requiresApproval: true } }),
      prisma.approval.create({
        data: {
          companyId: task.companyId,
          taskId: task.id,
          title: task.title,
          reason: approvalCheck.reason,
          impact: task.description ?? undefined,
          risk: "medium",
        },
      }),
      prisma.activity.create({
        data: {
          companyId: task.companyId,
          employeeId: task.employeeId,
          taskId: task.id,
          summary: `${task.employee?.name ?? "An employee"} requested approval for "${task.title}"`,
        },
      }),
    ]);
    return;
  }

  try {
    const result = await provider.complete({
      system: task.employee
        ? `You are ${task.employee.name}, the ${task.employee.role} at ${task.company.name}. Complete the assigned task and produce a concrete, usable result (draft text, analysis, plan, etc). Be specific to this real company, not generic.`
        : `You are the AI CEO of ${task.company.name}. Complete the assigned task.`,
      prompt: `Task: ${task.title}\n\nDetails: ${task.description ?? "None provided."}\n\nProduce the result now.`,
      maxTokens: 1200,
    });

    await prisma.$transaction([
      prisma.task.update({
        where: { id: taskId },
        data: { status: "completed", result, completedAt: new Date() },
      }),
      prisma.activity.create({
        data: {
          companyId: task.companyId,
          employeeId: task.employeeId,
          taskId: task.id,
          summary: `${task.employee?.name ?? "AI CEO"} completed "${task.title}"`,
        },
      }),
      prisma.auditLog.create({
        data: {
          companyId: task.companyId,
          actor: task.employee?.name ?? "AI CEO",
          action: `Completed task "${task.title}"`,
          result: "success",
        },
      }),
      ...(task.employeeId
        ? [prisma.employee.update({ where: { id: task.employeeId }, data: { tasksCompleted: { increment: 1 } } })]
        : []),
    ]);
  } catch (err) {
    await prisma.task.update({
      where: { id: taskId },
      data: { status: "failed", result: err instanceof Error ? err.message : "Unknown error" },
    });
    await prisma.auditLog.create({
      data: {
        companyId: task.companyId,
        actor: task.employee?.name ?? "system",
        action: `Failed task "${task.title}"`,
        result: "failure",
        reason: err instanceof Error ? err.message : "Unknown error",
      },
    });
  }
}

/** Runs a task that was just approved, bypassing the approval gate. */
export async function runApprovedTask(taskId: string): Promise<void> {
  const provider = getAIProvider();
  const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId }, include: { employee: true, company: true } });

  if (!provider.isConnected) {
    await prisma.task.update({
      where: { id: taskId },
      data: { status: "failed", result: "AI provider not connected. Add an API key in Settings to run this task." },
    });
    return;
  }

  await prisma.task.update({ where: { id: taskId }, data: { status: "working" } });

  try {
    const result = await provider.complete({
      system: task.employee
        ? `You are ${task.employee.name}, the ${task.employee.role} at ${task.company.name}. This task was approved by the owner. Complete it and produce a concrete result.`
        : `You are the AI CEO of ${task.company.name}. This task was approved by the owner. Complete it.`,
      prompt: `Task: ${task.title}\n\nDetails: ${task.description ?? "None provided."}\n\nProduce the result now.`,
      maxTokens: 1200,
    });

    await prisma.$transaction([
      prisma.task.update({ where: { id: taskId }, data: { status: "completed", result, completedAt: new Date() } }),
      prisma.activity.create({
        data: {
          companyId: task.companyId,
          employeeId: task.employeeId,
          taskId: task.id,
          summary: `${task.employee?.name ?? "AI CEO"} completed approved task "${task.title}"`,
        },
      }),
      prisma.auditLog.create({
        data: { companyId: task.companyId, actor: task.employee?.name ?? "AI CEO", action: `Completed approved task "${task.title}"`, result: "success" },
      }),
      ...(task.employeeId
        ? [prisma.employee.update({ where: { id: task.employeeId }, data: { tasksCompleted: { increment: 1 } } })]
        : []),
    ]);
  } catch (err) {
    await prisma.task.update({
      where: { id: taskId },
      data: { status: "failed", result: err instanceof Error ? err.message : "Unknown error" },
    });
  }
}
