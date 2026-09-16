import { prisma } from "@/lib/prisma";
import { getAIProvider } from "@/lib/ai/provider";

export interface BriefingItem {
  title: string;
  detail: string;
}

export interface Briefing {
  greeting: string;
  summary: string;
  items: BriefingItem[];
  generatedBy: "ai" | "system";
}

function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning.";
  if (hour < 18) return "Good afternoon.";
  return "Good evening.";
}

export async function generateBriefing(companyId: string): Promise<Briefing> {
  const since = new Date();
  since.setDate(since.getDate() - 1);

  const [tasksCompleted, pendingApprovals, openOpportunities, employees] = await Promise.all([
    prisma.task.count({ where: { companyId, status: "completed", completedAt: { gte: since } } }),
    prisma.approval.findMany({ where: { companyId, status: "pending" }, take: 5, orderBy: { createdAt: "desc" } }),
    prisma.opportunity.findMany({ where: { companyId, status: "open" }, take: 5, orderBy: { createdAt: "desc" } }),
    prisma.employee.count({ where: { companyId, status: "active" } }),
  ]);

  const items: BriefingItem[] = [];
  for (const a of pendingApprovals) {
    items.push({ title: a.title, detail: a.reason ?? "Waiting on your approval." });
  }
  for (const o of openOpportunities) {
    items.push({ title: o.title, detail: o.recommendedAction ?? o.description });
  }

  const greeting = timeGreeting();
  const provider = getAIProvider();

  if (items.length === 0 && tasksCompleted === 0) {
    return {
      greeting,
      summary:
        employees > 0
          ? `Your ${employees} AI employee${employees === 1 ? "" : "s"} ${employees === 1 ? "hasn't" : "haven't"} completed any tasks yet. Assign work from the Workforce or Tasks page, or ask me to do something with the command bar.`
          : "There's no workforce yet. Head to Workforce to bring on your first AI employees.",
      items: [],
      generatedBy: "system",
    };
  }

  if (!provider.isConnected) {
    return {
      greeting,
      summary: `Your AI workforce completed ${tasksCompleted} task${tasksCompleted === 1 ? "" : "s"} in the last 24 hours. I found ${items.length} item${items.length === 1 ? "" : "s"} that need your attention below.`,
      items,
      generatedBy: "system",
    };
  }

  try {
    const text = await provider.complete({
      system:
        "You are the AI CEO giving a concise daily briefing to the company owner. Use ONLY the facts given — never invent numbers, names, or events. 2-3 sentences.",
      prompt: `Facts:\n- Tasks completed in the last 24 hours: ${tasksCompleted}\n- Active AI employees: ${employees}\n- Items needing attention: ${items.map((i) => `${i.title} — ${i.detail}`).join("; ") || "none"}\n\nWrite the briefing summary now (do not repeat "Good morning").`,
      maxTokens: 300,
    });
    return { greeting, summary: text.trim(), items, generatedBy: "ai" };
  } catch {
    return {
      greeting,
      summary: `Your AI workforce completed ${tasksCompleted} task${tasksCompleted === 1 ? "" : "s"} in the last 24 hours. I found ${items.length} item${items.length === 1 ? "" : "s"} that need your attention below.`,
      items,
      generatedBy: "system",
    };
  }
}
