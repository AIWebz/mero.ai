"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Settings {
  aiAutonomyLevel: string;
  timezone: string;
  notifyEmail: string;
}

interface Member {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

const AUTONOMY_OPTIONS = [
  { value: "supervised", label: "Supervised — everything sensitive waits for approval" },
  { value: "autonomous_low_risk", label: "Low-risk autonomous — routine actions run automatically" },
  { value: "autonomous_full", label: "Fully autonomous — approvals only for high-risk actions" },
];

export function SettingsView({
  companyId,
  aiConnected,
  aiProviderName,
  settings,
  members,
}: {
  companyId: string;
  aiConnected: boolean;
  aiProviderName: string;
  settings: Settings;
  members: Member[];
}) {
  const router = useRouter();
  const [fields, setFields] = useState(settings);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/companies/${companyId}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>AI provider</CardTitle>
          <CardDescription>Powers company generation, employee chat, and task execution.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div className="flex items-center gap-2 text-sm">
              {aiConnected ? (
                <CheckCircle2 className="size-4 text-success" />
              ) : (
                <XCircle className="size-4 text-muted" />
              )}
              {aiProviderName}
            </div>
            <Badge variant={aiConnected ? "success" : "outline"}>{aiConnected ? "Connected" : "Not connected"}</Badge>
          </div>
          {!aiConnected && (
            <p className="mt-2 text-xs text-muted">
              Set the ANTHROPIC_API_KEY environment variable on the server to connect a real model.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Autonomy</CardTitle>
          <CardDescription>How much your AI workforce can do without asking first.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={fields.aiAutonomyLevel} onValueChange={(v) => setFields({ ...fields, aiAutonomyLevel: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AUTONOMY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Timezone</Label>
              <Input value={fields.timezone} onChange={(e) => setFields({ ...fields, timezone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Notification email</Label>
              <Input
                type="email"
                value={fields.notifyEmail}
                onChange={(e) => setFields({ ...fields, notifyEmail: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="accent" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>People</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-4">
              <Avatar className="size-8">
                <AvatarFallback>{(m.name ?? m.email)[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">{m.name ?? m.email}</p>
                <p className="text-xs text-muted">{m.email}</p>
              </div>
              <Badge variant="outline">{m.role}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
