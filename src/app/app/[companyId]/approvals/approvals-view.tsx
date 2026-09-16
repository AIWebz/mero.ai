"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { timeAgo, cn } from "@/lib/utils";

interface Approval {
  id: string;
  title: string;
  reason: string | null;
  impact: string | null;
  risk: string;
  status: string;
  createdAt: string;
  employeeName: string;
}

const RISK_VARIANT: Record<string, "success" | "warning" | "danger"> = {
  low: "success",
  medium: "warning",
  high: "danger",
};

export function ApprovalsView({ companyId, approvals }: { companyId: string; approvals: Approval[] }) {
  const router = useRouter();
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const pending = approvals.filter((a) => a.status === "pending");
  const decided = approvals.filter((a) => a.status !== "pending");

  async function decide(id: string, decision: "approved" | "rejected") {
    setPendingIds((s) => new Set(s).add(id));
    await fetch(`/api/companies/${companyId}/approvals/${id}/decide`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted">Pending ({pending.length})</h2>
        {pending.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center text-sm text-muted">Nothing waiting on you right now.</CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pending.map((a) => (
              <Card key={a.id}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">{a.title}</p>
                      <p className="text-xs text-muted">{a.employeeName} wants to do this &middot; {timeAgo(a.createdAt)}</p>
                    </div>
                    <Badge variant={RISK_VARIANT[a.risk] ?? "outline"}>{a.risk} risk</Badge>
                  </div>
                  {a.reason && (
                    <p className="text-sm">
                      <span className="text-muted">Why: </span>
                      {a.reason}
                    </p>
                  )}
                  {a.impact && (
                    <p className="text-sm">
                      <span className="text-muted">Expected impact: </span>
                      {a.impact}
                    </p>
                  )}
                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => decide(a.id, "rejected")}
                      disabled={pendingIds.has(a.id)}
                    >
                      <X className="size-3.5" />
                      Reject
                    </Button>
                    <Button size="sm" variant="accent" onClick={() => decide(a.id, "approved")} disabled={pendingIds.has(a.id)}>
                      <Check className="size-3.5" />
                      Approve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {decided.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted">History</h2>
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {decided.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted">{a.employeeName} &middot; {timeAgo(a.createdAt)}</p>
                  </div>
                  <Badge variant={a.status === "approved" ? "success" : "outline"} className={cn(a.status === "rejected" && "text-danger")}>
                    {a.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
