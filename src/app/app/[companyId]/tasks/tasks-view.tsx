"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { timeAgo, cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  result: string | null;
  createdAt: string;
  employeeName: string | null;
}

const STATUS_VARIANT: Record<string, "default" | "accent" | "success" | "warning" | "danger" | "outline"> = {
  pending: "outline",
  working: "accent",
  awaiting_approval: "warning",
  completed: "success",
  failed: "danger",
  cancelled: "outline",
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "working", label: "Working" },
  { key: "awaiting_approval", label: "Awaiting approval" },
  { key: "completed", label: "Completed" },
  { key: "failed", label: "Failed" },
];

export function TasksView({
  companyId,
  employees,
  tasks,
}: {
  companyId: string;
  employees: { id: string; name: string }[];
  tasks: Task[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [employeeId, setEmployeeId] = useState<string>("");

  const filtered = useMemo(() => (filter === "all" ? tasks : tasks.filter((t) => t.status === filter)), [tasks, filter]);

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    await fetch(`/api/companies/${companyId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, employeeId: employeeId || undefined }),
    });
    setCreating(false);
    setOpen(false);
    setTitle("");
    setDescription("");
    setEmployeeId("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            {FILTERS.map((f) => (
              <TabsTrigger key={f.key} value={f.key}>
                {f.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button variant="accent" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          New task
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-sm text-muted">No tasks here.</CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {filtered.map((t) => (
              <div key={t.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{t.title}</p>
                    {t.description && <p className="mt-0.5 line-clamp-2 text-sm text-muted">{t.description}</p>}
                    {t.result && (
                      <p className={cn("mt-1.5 rounded-md bg-surface-muted p-2 text-xs", t.status === "failed" && "text-danger")}>
                        {t.result}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <Badge variant={STATUS_VARIANT[t.status] ?? "outline"}>{t.status.replace("_", " ")}</Badge>
                    <span className="text-xs text-muted">{t.employeeName ?? "Unassigned"}</span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted">{timeAgo(t.createdAt)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a task</DialogTitle>
          </DialogHeader>
          <form onSubmit={createTask} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="task-title">Title</Label>
              <Input id="task-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-desc">Description</Label>
              <Textarea id="task-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Assign to</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="AI CEO decides" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="accent" disabled={creating}>
                {creating ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
