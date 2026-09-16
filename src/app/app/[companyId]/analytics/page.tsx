import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCompanyAccess } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { Link2 } from "lucide-react";
import { formatCurrency, timeAgo } from "@/lib/utils";

export default async function AnalyticsPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  await requireCompanyAccess(companyId);

  const snapshots = await prisma.metricSnapshot.findMany({ where: { companyId }, orderBy: { capturedAt: "desc" }, take: 50 });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted">Real performance data, once a data source is connected.</p>
      </div>

      {snapshots.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <Link2 className="size-6 text-muted" />
            <p className="text-sm text-muted">
              No analytics connected yet. Connect Google Analytics, Stripe, or Shopify to see real traffic, revenue,
              and conversion data here.
            </p>
            <Link href={`/app/${companyId}/integrations`} className="text-sm font-medium text-accent hover:underline">
              Go to Integrations
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {snapshots.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">{s.metric.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted">via {s.source}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {s.metric === "revenue" ? formatCurrency(s.value) : s.value}
                  </p>
                  <p className="text-xs text-muted">{timeAgo(s.capturedAt)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
