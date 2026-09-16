"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CompanyFields {
  name: string;
  description: string;
  industry: string;
  businessModel: string;
  targetCustomer: string;
  domain: string;
}

interface BrandFields {
  tone: string;
  voice: string;
  colors: string[];
}

interface Goal {
  id: string;
  title: string;
  status: string;
}

export function CompanyView({
  companyId,
  company,
  brand,
  goals,
}: {
  companyId: string;
  company: CompanyFields;
  brand: BrandFields;
  goals: Goal[];
}) {
  const router = useRouter();
  const [fields, setFields] = useState(company);
  const [brandFields, setBrandFields] = useState(brand);
  const [saving, setSaving] = useState(false);
  const [newGoal, setNewGoal] = useState("");

  async function save() {
    setSaving(true);
    await fetch(`/api/companies/${companyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...fields, brand: brandFields }),
    });
    setSaving(false);
    router.refresh();
  }

  async function addGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!newGoal.trim()) return;
    await fetch(`/api/companies/${companyId}/goals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newGoal }),
    });
    setNewGoal("");
    router.refresh();
  }

  async function markAchieved(goalId: string) {
    await fetch(`/api/companies/${companyId}/goals/${goalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "achieved" }),
    });
    router.refresh();
  }

  async function removeGoal(goalId: string) {
    await fetch(`/api/companies/${companyId}/goals/${goalId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={fields.name} onChange={(e) => setFields({ ...fields, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Domain</Label>
              <Input value={fields.domain} onChange={(e) => setFields({ ...fields, domain: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea rows={3} value={fields.description} onChange={(e) => setFields({ ...fields, description: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Industry</Label>
              <Input value={fields.industry} onChange={(e) => setFields({ ...fields, industry: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Business model</Label>
              <Input value={fields.businessModel} onChange={(e) => setFields({ ...fields, businessModel: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Target customer</Label>
            <Textarea rows={2} value={fields.targetCustomer} onChange={(e) => setFields({ ...fields, targetCustomer: e.target.value })} />
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
              <Label>Tone</Label>
              <Input value={brandFields.tone} onChange={(e) => setBrandFields({ ...brandFields, tone: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Voice</Label>
            <Textarea rows={2} value={brandFields.voice} onChange={(e) => setBrandFields({ ...brandFields, voice: e.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            {brandFields.colors.map((c, i) => (
              <span key={i} className="size-6 rounded-full border border-border" style={{ backgroundColor: c }} title={c} />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="accent" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Goals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {goals.map((g) => (
            <div key={g.id} className="flex items-center justify-between rounded-md border border-border p-3">
              <span className={cn("text-sm", g.status === "achieved" && "text-muted line-through")}>{g.title}</span>
              <div className="flex items-center gap-2">
                <Badge variant={g.status === "achieved" ? "success" : "outline"}>{g.status}</Badge>
                {g.status === "active" && (
                  <Button size="icon" variant="ghost" className="size-7" onClick={() => markAchieved(g.id)}>
                    <Check className="size-3.5" />
                  </Button>
                )}
                <Button size="icon" variant="ghost" className="size-7" onClick={() => removeGoal(g.id)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
          <form onSubmit={addGoal} className="flex gap-2">
            <Input value={newGoal} onChange={(e) => setNewGoal(e.target.value)} placeholder="Add a goal" />
            <Button type="submit" variant="outline">
              <Plus className="size-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
