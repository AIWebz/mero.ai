import { prisma } from "@/lib/prisma";
import { getAIProvider, extractJSON } from "@/lib/ai/provider";
import { runTask } from "./taskRunner";

interface CeoDecision {
  mode: "answer" | "delegate";
  answer?: string;
  delegateTo?: string; // employee kind: sales | marketing | support | research | analyst | developer | operations
  taskTitle?: string;
  taskDescription?: string;
  priority?: "low" | "normal" | "high" | "urgent";
}

export interface CommandResult {
  message: string;
  taskId?: string;
}

export async function handleCommand(companyId: string, command: string): Promise<CommandResult> {
  const provider = getAIProvider();
  const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });
  const employees = await prisma.employee.findMany({ where: { companyId } });

  if (!provider.isConnected) {
    return {
      message:
        "The AI CEO isn't connected to a model yet. Add an AI provider API key in Settings, then I can route commands to the right AI employee.",
    };
  }

  const [openTasks, recentActivity, metrics] = await Promise.all([
    prisma.task.count({ where: { companyId, status: { in: ["pending", "working", "awaiting_approval"] } } }),
    prisma.activity.findMany({ where: { companyId }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.metricSnapshot.findMany({ where: { companyId }, orderBy: { capturedAt: "desc" }, take: 10 }),
  ]);

  const context = [
    `Company: ${company.name} — ${company.description ?? "no description"}`,
    `AI employees available: ${employees.map((e) => `${e.name} (${e.kind})`).join(", ") || "none yet"}`,
    `Open tasks: ${openTasks}`,
    `Recent activity: ${recentActivity.map((a) => a.summary).join("; ") || "none"}`,
    `Connected metrics: ${metrics.length ? metrics.map((m) => `${m.metric}=${m.value}`).join(", ") : "none — no data sources connected"}`,
  ].join("\n");

  const prompt = `Company context:\n${context}\n\nOwner command: "${command}"\n\nDecide how to handle this. If you can answer directly from the context above (and only from real information given — never invent data, especially numbers), respond in "answer" mode. If the request requires an AI employee to actually go do something, respond in "delegate" mode, choosing the best-fit employee kind from those available. If no employee with the right kind exists, still choose the closest kind and explain why in taskDescription.\n\nRespond with strict JSON only:\n{ "mode": "answer" | "delegate", "answer"?: string, "delegateTo"?: string, "taskTitle"?: string, "taskDescription"?: string, "priority"?: "low"|"normal"|"high"|"urgent" }`;

  const text = await provider.complete({
    system:
      "You are the AI CEO of this company: calm, decisive, and honest. You never fabricate data. If no data source is connected, say so instead of guessing numbers.",
    prompt,
    maxTokens: 700,
  });

  const decision = extractJSON<CeoDecision>(text);

  if (decision.mode === "answer") {
    await prisma.activity.create({
      data: { companyId, summary: "AI CEO answered a command", detail: command },
    });
    return { message: decision.answer ?? "I don't have enough information to answer that yet." };
  }

  const employee = employees.find((e) => e.kind === decision.delegateTo) ?? employees.find((e) => e.kind === "ceo");

  const task = await prisma.task.create({
    data: {
      companyId,
      employeeId: employee?.id,
      title: decision.taskTitle ?? command,
      description: decision.taskDescription ?? command,
      priority: decision.priority ?? "normal",
      status: "pending",
    },
  });

  await prisma.activity.create({
    data: {
      companyId,
      employeeId: employee?.id,
      taskId: task.id,
      summary: `AI CEO delegated "${task.title}" to ${employee?.name ?? "the team"}`,
    },
  });

  // Fire and forget — the task runner updates its own status as it progresses.
  runTask(task.id).catch(() => {});

  return {
    message: `Delegated to ${employee?.name ?? "the team"}: "${task.title}". I'll report back once it's done.`,
    taskId: task.id,
  };
}
