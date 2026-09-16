"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, ArrowLeft, X, Plus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CompanyProposal, GenerationSource } from "@/lib/ai/companyGenerator";

const EXAMPLE =
  "I want to create a premium dog accessories company selling stylish travel products for dog owners.";

function ListEditor({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={v}
              onChange={(e) => {
                const next = [...values];
                next[i] = e.target.value;
                onChange(next);
              }}
            />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, idx) => idx !== i))}
              className="shrink-0 rounded-md p-2 text-muted hover:bg-surface-muted hover:text-foreground"
              aria-label="Remove"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
      <Button type="button" size="sm" variant="outline" onClick={() => onChange([...values, ""])}>
        <Plus className="size-3.5" />
        Add
      </Button>
    </div>
  );
}

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState<"idea" | "review">("idea");
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<GenerationSource>("template");
  const [proposal, setProposal] = useState<CompanyProposal | null>(null);

  async function submitIdea(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Something went wrong" }));
        throw new Error(body.error ?? "Something went wrong");
      }
      const data = await res.json();
      setProposal(data.proposal);
      setSource(data.source);
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function confirmAndCreate() {
    if (!proposal) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposal }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Something went wrong" }));
        throw new Error(body.error ?? "Something went wrong");
      }
      const data = await res.json();
      router.push(`/onboarding/building/${data.companyId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setCreating(false);
    }
  }

  function update<K extends keyof CompanyProposal>(key: K, value: CompanyProposal[K]) {
    if (!proposal) return;
    setProposal({ ...proposal, [key]: value });
  }

  if (step === "idea") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl space-y-8 text-center">
          <div className="space-y-2">
            <p className="text-sm font-medium text-accent">Step 1 of 2</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              What do you want to build?
            </h1>
            <p className="text-muted">Describe the company you want to create.</p>
          </div>
          <form onSubmit={submitIdea} className="space-y-4 text-left">
            <Textarea
              autoFocus
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder={EXAMPLE}
              rows={5}
              maxLength={2000}
              required
              minLength={10}
              className="text-base"
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted">Example: &ldquo;{EXAMPLE}&rdquo;</p>
              <Button type="submit" variant="accent" disabled={loading}>
                {loading ? (
                  "Analyzing…"
                ) : (
                  <>
                    Continue
                    <ArrowRight />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (!proposal) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 space-y-2 text-center">
        <p className="text-sm font-medium text-accent">Step 2 of 2</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          <Sparkles className="mr-2 inline size-6 text-accent" />
          Here&apos;s what Mero designed
        </h1>
        <p className="text-muted">Review and edit anything before Mero builds your company.</p>
      </div>

      {source === "template" && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 p-4 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-warning" />
          <p>
            No AI provider is connected, so these fields were filled from a basic default template
            rather than generated. Edit them below, or connect an AI provider in Settings after
            launch for AI-generated plans.
          </p>
        </div>
      )}

      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Company</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={proposal.name} onChange={(e) => update("name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="domain">Suggested domain</Label>
                <Input
                  id="domain"
                  value={proposal.suggestedDomain}
                  onChange={(e) => update("suggestedDomain", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={proposal.description}
                onChange={(e) => update("description", e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="industry">Industry</Label>
                <Input id="industry" value={proposal.industry} onChange={(e) => update("industry", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="businessModel">Business model</Label>
                <Input
                  id="businessModel"
                  value={proposal.businessModel}
                  onChange={(e) => update("businessModel", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer & offering</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="targetCustomer">Target customer</Label>
              <Textarea
                id="targetCustomer"
                rows={2}
                value={proposal.targetCustomer}
                onChange={(e) => update("targetCustomer", e.target.value)}
              />
            </div>
            <ListEditor label="Products / services" values={proposal.products} onChange={(v) => update("products", v)} />
            <div className="space-y-1.5">
              <Label htmlFor="pricingStrategy">Pricing strategy</Label>
              <Textarea
                id="pricingStrategy"
                rows={2}
                value={proposal.pricingStrategy}
                onChange={(e) => update("pricingStrategy", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Brand</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="brandTone">Tone</Label>
                <Input id="brandTone" value={proposal.brandTone} onChange={(e) => update("brandTone", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="brandPersonality">Personality (comma separated)</Label>
                <Input
                  id="brandPersonality"
                  value={proposal.brandPersonality.join(", ")}
                  onChange={(e) => update("brandPersonality", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brandVoice">Voice</Label>
              <Textarea id="brandVoice" rows={2} value={proposal.brandVoice} onChange={(e) => update("brandVoice", e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              {proposal.brandColors.map((c, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="size-6 rounded-full border border-border" style={{ backgroundColor: c }} />
                  <Input
                    className="h-8 w-24 text-xs"
                    value={c}
                    onChange={(e) => {
                      const next = [...proposal.brandColors];
                      next[i] = e.target.value;
                      update("brandColors", next);
                    }}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Initial goals</CardTitle>
          </CardHeader>
          <CardContent>
            <ListEditor label="" values={proposal.goals} onChange={(v) => update("goals", v)} />
          </CardContent>
        </Card>
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <div className="mt-8 flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={() => setStep("idea")}>
          <ArrowLeft />
          Back
        </Button>
        <Button type="button" variant="accent" size="lg" onClick={confirmAndCreate} disabled={creating}>
          {creating ? "Creating your company…" : "Build My Company"}
          {!creating && <ArrowRight />}
        </Button>
      </div>
    </div>
  );
}
