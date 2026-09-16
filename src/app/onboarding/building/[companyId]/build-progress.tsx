"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BuildStep {
  id: string;
  key: string;
  label: string;
  status: "pending" | "running" | "completed" | "failed";
  error: string | null;
}

export function BuildProgress({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [steps, setSteps] = useState<BuildStep[]>([]);
  const [companyStatus, setCompanyStatus] = useState<string>("building");
  const [retrying, setRetrying] = useState(false);

  const poll = useCallback(async () => {
    const res = await fetch(`/api/companies/${companyId}/build-steps`, { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setSteps(data.steps);
    setCompanyStatus(data.status);
  }, [companyId]);

  useEffect(() => {
    // Poll immediately on mount, then on an interval — intentional, not a derived-state update.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    poll();
    const interval = setInterval(poll, 1200);
    return () => clearInterval(interval);
  }, [poll]);

  useEffect(() => {
    if (companyStatus === "active") {
      const t = setTimeout(() => router.push(`/app/${companyId}`), 900);
      return () => clearTimeout(t);
    }
  }, [companyStatus, companyId, router]);

  const hasFailed = steps.some((s) => s.status === "failed");

  async function retry() {
    setRetrying(true);
    await fetch(`/api/companies/${companyId}/build/retry`, { method: "POST" });
    setRetrying(false);
    poll();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <h1 className="mb-1 text-center text-2xl font-semibold tracking-tight">
          {companyStatus === "active" ? "Your company is ready" : "Creating your company…"}
        </h1>
        <p className="mb-8 text-center text-sm text-muted">
          {companyStatus === "active" ? "Taking you to your dashboard." : "This only takes a moment."}
        </p>
        <ul className="space-y-3">
          {steps.map((step) => (
            <li key={step.id} className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
                  step.status === "completed" && "border-success bg-success text-white",
                  step.status === "running" && "border-accent text-accent",
                  step.status === "failed" && "border-danger bg-danger text-white",
                  step.status === "pending" && "border-border text-transparent",
                )}
              >
                {step.status === "completed" && <Check className="size-3.5" />}
                {step.status === "running" && <Loader2 className="size-3.5 animate-spin" />}
                {step.status === "failed" && <AlertCircle className="size-3.5" />}
              </span>
              <div>
                <p
                  className={cn(
                    "text-sm",
                    step.status === "pending" ? "text-muted" : "text-foreground font-medium",
                  )}
                >
                  {step.label}
                </p>
                {step.status === "failed" && step.error && (
                  <p className="mt-0.5 text-xs text-danger">{step.error}</p>
                )}
              </div>
            </li>
          ))}
        </ul>

        {hasFailed && (
          <div className="mt-8 flex justify-center">
            <Button onClick={retry} disabled={retrying} variant="outline">
              <RotateCcw className={cn("size-4", retrying && "animate-spin")} />
              {retrying ? "Retrying…" : "Retry"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
