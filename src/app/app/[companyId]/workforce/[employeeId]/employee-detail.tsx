"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Pause, Play, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EMPLOYEE_KIND_ICON, type EmployeeKind } from "@/lib/employee-icons";
import { cn, timeAgo } from "@/lib/utils";

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt?: string;
}

const PERMISSION_LABELS: Record<string, string> = {
  read_analytics: "Read analytics",
  create_content: "Create content",
  publish_content: "Publish content",
  spend_money: "Spend money",
  send_email: "Send email",
};

export function EmployeeDetail({
  companyId,
  employee,
  tasks,
  activities,
}: {
  companyId: string;
  employee: {
    id: string;
    name: string;
    role: string;
    kind: string;
    goal: string | null;
    schedule: string | null;
    status: string;
    tasksCompleted: number;
    permissions: Record<string, boolean>;
    tools: string[];
  };
  tasks: { id: string; title: string; status: string; createdAt: string; result: string | null }[];
  activities: { id: string; summary: string; createdAt: string }[];
}) {
  const router = useRouter();
  const Icon = EMPLOYEE_KIND_ICON[employee.kind as EmployeeKind] ?? EMPLOYEE_KIND_ICON.operations;
  const [messages, setMessages] = useState<Message[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [permissions, setPermissions] = useState(employee.permissions);
  const [status, setStatus] = useState(employee.status);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ignore = false;
    fetch(`/api/companies/${companyId}/employees/${employee.id}/messages`)
      .then((r) => r.json())
      .then((d) => {
        // A message may already have been sent (and replied to) by the time this slow initial
        // load resolves — never clobber newer local state with this stale history fetch.
        if (!ignore) setMessages((m) => (m.length > 0 ? m : (d.messages ?? [])));
      })
      .finally(() => {
        if (!ignore) setHistoryLoaded(true);
      });
    return () => {
      ignore = true;
    };
  }, [companyId, employee.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input;
    setInput("");
    setMessages((m) => [...m, { id: `local-${Date.now()}`, role: "user", content: text }]);
    setSending(true);
    const res = await fetch(`/api/companies/${companyId}/employees/${employee.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    const data = await res.json();
    setMessages((m) => [...m, { id: `reply-${Date.now()}`, role: "assistant", content: data.reply }]);
    setSending(false);
  }

  async function togglePermission(key: string, value: boolean) {
    const next = { ...permissions, [key]: value };
    setPermissions(next);
    await fetch(`/api/companies/${companyId}/employees/${employee.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissions: next }),
    });
    router.refresh();
  }

  async function toggleStatus() {
    setTogglingStatus(true);
    const next = status === "active" ? "paused" : "active";
    await fetch(`/api/companies/${companyId}/employees/${employee.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setStatus(next);
    setTogglingStatus(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm(`Remove ${employee.name} from the workforce?`)) return;
    await fetch(`/api/companies/${companyId}/employees/${employee.id}`, { method: "DELETE" });
    router.push(`/app/${companyId}/workforce`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <Link href={`/app/${companyId}/workforce`} className="flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="size-3.5" />
        Workforce
      </Link>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-full bg-surface-muted">
            <Icon className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{employee.name}</h1>
            <p className="text-sm text-muted">{employee.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={status === "active" ? "success" : "outline"}>{status}</Badge>
          <Button size="sm" variant="outline" onClick={toggleStatus} disabled={togglingStatus}>
            {status === "active" ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            {status === "active" ? "Pause" : "Resume"}
          </Button>
          <Button size="sm" variant="ghost" onClick={remove}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {employee.goal && <p className="text-sm text-muted">Goal: {employee.goal}</p>}

      <Tabs defaultValue="chat">
        <TabsList>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <Card>
            <CardContent className="flex h-[28rem] flex-col p-0">
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.length === 0 && (
                  <p className="text-sm text-muted">
                    Start a conversation with {employee.name}. Ask what they&apos;re working on, or ask them to do
                    something.
                  </p>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                        m.role === "user" ? "bg-accent text-accent-foreground" : "bg-surface-muted",
                      )}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-1.5 rounded-lg bg-surface-muted px-3 py-2 text-sm text-muted">
                      <Loader2 className="size-3.5 animate-spin" />
                      {employee.name} is thinking…
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-border p-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={historyLoaded ? `Message ${employee.name}…` : "Loading conversation…"}
                  disabled={sending || !historyLoaded}
                />
                <Button type="submit" size="icon" variant="accent" disabled={sending || !historyLoaded || !input.trim()}>
                  <Send className="size-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          {tasks.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center text-sm text-muted">No tasks assigned yet.</CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="divide-y divide-border p-0">
                {tasks.map((t) => (
                  <div key={t.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{t.title}</p>
                      <Badge variant="outline">{t.status.replace("_", " ")}</Badge>
                    </div>
                    {t.result && <p className="mt-1 text-sm text-muted">{t.result}</p>}
                    <p className="mt-1 text-xs text-muted">{timeAgo(t.createdAt)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="permissions">
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between p-4">
                  <Label htmlFor={key} className="text-sm font-normal">
                    {label}
                  </Label>
                  <Switch id={key} checked={!!permissions[key]} onCheckedChange={(v) => togglePermission(key, v)} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          {activities.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center text-sm text-muted">No activity yet.</CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="divide-y divide-border p-0">
                {activities.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-4">
                    <p className="text-sm">{a.summary}</p>
                    <span className="shrink-0 text-xs text-muted">{timeAgo(a.createdAt)}</span>
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
