import { prisma } from "@/lib/prisma";
import { getAIProvider } from "@/lib/ai/provider";
import type { Employee, Company } from "@prisma/client";

function systemPromptFor(employee: Employee, company: Company, memory: string[]): string {
  const permissions = JSON.parse(employee.permissionsJson) as Record<string, boolean>;
  const allowed = Object.entries(permissions)
    .filter(([, v]) => v)
    .map(([k]) => k);
  const denied = Object.entries(permissions)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  return [
    `You are ${employee.name}, the ${employee.role} at ${company.name}.`,
    `Company: ${company.description ?? "No description yet."}`,
    `Your goal: ${employee.goal ?? "Support the company's success."}`,
    memory.length ? `Relevant company knowledge:\n${memory.join("\n")}` : "",
    allowed.length ? `You are permitted to: ${allowed.join(", ")}.` : "",
    denied.length
      ? `You are NOT permitted to: ${denied.join(", ")}. If asked to do one of these, explain you need owner approval first rather than pretending to do it.`
      : "",
    "Be concise, concrete, and honest. Never claim to have taken an action or analyzed data you don't actually have access to. If you don't have real data connected, say so plainly.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function sendEmployeeMessage(conversationId: string, userMessage: string): Promise<string> {
  const conversation = await prisma.conversation.findUniqueOrThrow({
    where: { id: conversationId },
    include: { employee: true, company: true, messages: { orderBy: { createdAt: "asc" } } },
  });

  await prisma.message.create({
    data: { conversationId, role: "user", content: userMessage },
  });

  const provider = getAIProvider();
  if (!provider.isConnected) {
    const reply =
      "I'm not connected to an AI model yet, so I can't reason about this. Ask the owner to add an AI provider API key in Settings — once connected I'll respond for real.";
    await prisma.message.create({ data: { conversationId, role: "assistant", content: reply } });
    return reply;
  }

  const memoryEntries = await prisma.companyMemory.findMany({
    where: { companyId: conversation.companyId },
    take: 8,
    orderBy: { updatedAt: "desc" },
  });

  const history = conversation.messages
    .map((m) => `${m.role === "user" ? "Owner" : conversation.employee.name}: ${m.content}`)
    .join("\n");

  const prompt = `${history ? history + "\n" : ""}Owner: ${userMessage}\n${conversation.employee.name}:`;

  const reply = await provider.complete({
    system: systemPromptFor(conversation.employee, conversation.company, memoryEntries.map((m) => `- ${m.key}: ${m.content}`)),
    prompt,
    maxTokens: 800,
  });

  await prisma.message.create({ data: { conversationId, role: "assistant", content: reply } });

  await prisma.activity.create({
    data: {
      companyId: conversation.companyId,
      employeeId: conversation.employeeId,
      summary: `${conversation.employee.name} replied in chat`,
      detail: userMessage.slice(0, 200),
    },
  });

  return reply;
}
