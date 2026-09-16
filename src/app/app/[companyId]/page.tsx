import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCompanyAccess } from "@/lib/session";
import { generateBriefing } from "@/lib/orchestration/briefing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, Users, ListChecks, TrendingUp, Link2 } from "lucide-react";
import { timeAgo, formatCurrency } from "@/lib/utils";

const EXTERNAL_METRICS: { key: string; label: string; format: "currency" | "number" | "percent" }[] = [
  { key: "revenue", label: "Revenue", format: "currency" },
  { key: "customers", label: "Customers", format: "number" },
  { key: "leads", label: "Leads", format: "number" },
  { key: "conversion_rate", label: "Conversion rate", format: "percent" },
  { key: "traffic", label: "Traffic", format: "number" },
];

function formatMetric(value: number, format: "currency" | "number" | "percent") {
  if (format === "currency") return formatCurrency(value);
  if (format === "percent") return `${value.toFixed(1)}%`;
  return new Intl.NumberFormat("en-US").format(value);
}

export default async function OverviewPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  await requireCompanyAccess(companyId);

  const [company, employeeCount, taskCount, activities, briefing, metricRows] = await Promise.all([
    prisma.company.findUniqueOrThrow({ where: { id: companyId } }),
    prisma.employee.count({ where: { companyId, status: "active" } }),
    prisma.task.count({ where: { companyId, status: { in: ["pending", "working", "awaiting_approval"] } } }),
    prisma.activity.findMany({
      where: { companyId },
      include: { employee: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    generateBriefing(companyId),
    prisma.metricSnapshot.findMany({ where: { companyId }, orderBy: { capturedAt: "desc" } }),
  ]);

  const latestByMetric = new Map<string, number>();
  for (const row of metricRows) {
    if (!latestByMetric.has(row.metric)) latestByMetric.set(row.metric, row.value);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{company.name}</h1>
          <p className="text-sm text-muted">{company.description}</p>
        </div>
        <Badge variant={company.status === "active" ? "success" : "outline"}>{company.status}</Badge>
      </div>

      <Card className="border-accent/20 bg-accent/[0.03]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-accent" />
            <CardTitle>AI CEO Briefing</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">
            <span className="font-medium">{briefing.greeting}</span> {briefing.summary}
          </p>
          {briefing.items.length > 0 && (
            <ul className="space-y-2">
              {briefing.items.map((item, i) => (
                <li key={i} className="rounded-md border border-border bg-surface p-3 text-sm">
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-0.5 text-muted">{item.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted">Company health</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <Users className="size-3.5" /> Active employees
              </p>
              <p className="mt-1 text-2xl font-semibold">{employeeCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <ListChecks className="size-3.5" /> Open tasks
              </p>
              <p className="mt-1 text-2xl font-semibold">{taskCount}</p>
            </CardContent>
          </Card>
          {EXTERNAL_METRICS.slice(0, 2).map((m) => {
            const value = latestByMetric.get(m.key);
            return (
              <Card key={m.key}>
                <CardContent className="p-4">
                  <p className="flex items-center gap-1.5 text-xs text-muted">
                    <TrendingUp className="size-3.5" /> {m.label}
                  </p>
                  <p className="mt-1 text-2xl font-semibold">
                    {value !== undefined ? formatMetric(value, m.format) : <span className="text-base text-muted">—</span>}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {EXTERNAL_METRICS.every((m) => !latestByMetric.has(m.key)) && (
          <Card className="mt-4 border-dashed">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2 text-sm text-muted">
                <Link2 className="size-4" />
                Connect your data sources to see live company metrics.
              </div>
              <Link href={`/app/${companyId}/integrations`} className="flex items-center gap-1 text-sm font-medium text-accent hover:underline">
                Connect
                <ArrowRight className="size-3.5" />
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted">Recent activity</h2>
          <Link href={`/app/${companyId}/activity`} className="text-sm text-accent hover:underline">
            View all
          </Link>
        </div>
        {activities.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center text-sm text-muted">
              No activity yet. Once your AI workforce starts working, real actions will show up here.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {activities.map((a) => (
                <div key={a.id} className="flex items-start justify-between gap-4 p-4">
                  <div>
                    <p className="text-sm font-medium">{a.employee?.name ?? "AI CEO"}</p>
                    <p className="text-sm text-muted">{a.summary}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted">{timeAgo(a.createdAt)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
