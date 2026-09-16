import { prisma } from "@/lib/prisma";
import { requireCompanyAccess } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/utils";

export default async function ActivityPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  await requireCompanyAccess(companyId);

  const [activities, auditLogs] = await Promise.all([
    prisma.activity.findMany({
      where: { companyId },
      include: { employee: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.auditLog.findMany({ where: { companyId }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
        <p className="text-sm text-muted">Every real action your AI workforce has taken, and the full audit trail.</p>
      </div>

      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="audit">Audit log</TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          {activities.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-sm text-muted">
                No activity yet. Actions your AI workforce takes will show up here in real time.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="divide-y divide-border p-0">
                {activities.map((a) => (
                  <div key={a.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{a.employee?.name ?? "AI CEO"}</p>
                      <span className="text-xs text-muted">{timeAgo(a.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted">{a.summary}</p>
                    {a.detail && <p className="mt-1 text-xs text-muted">{a.detail}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="audit">
          {auditLogs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-sm text-muted">No audit entries yet.</CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="divide-y divide-border p-0">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{log.actor}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={log.result === "success" ? "success" : "danger"}>{log.result}</Badge>
                        <span className="text-xs text-muted">{timeAgo(log.createdAt)}</span>
                      </div>
                    </div>
                    <p className="mt-0.5 text-sm text-muted">{log.action}</p>
                    {log.reason && <p className="mt-1 text-xs text-muted">Reason: {log.reason}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
