"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EMPLOYEE_KIND_ICON, EMPLOYEE_KIND_LABEL, type EmployeeKind } from "@/lib/employee-icons";

interface EmployeeSummary {
  id: string;
  name: string;
  role: string;
  kind: string;
  status: string;
  goal: string | null;
  schedule: string | null;
  tasksCompleted: number;
  permissions: Record<string, boolean>;
  currentTask: string | null;
  lastActivity: string | null;
}

export function WorkforceGrid({ companyId, employees }: { companyId: string; employees: EmployeeSummary[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [kind, setKind] = useState<EmployeeKind>("operations");
  const [goal, setGoal] = useState("");

  async function createEmployee(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    await fetch(`/api/companies/${companyId}/employees`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role, kind, goal }),
    });
    setCreating(false);
    setOpen(false);
    setName("");
    setRole("");
    setGoal("");
    router.refresh();
  }

  return (
    <>
      <div className="flex justify-end">
        <Button variant="accent" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Create employee
        </Button>
      </div>

      {employees.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-sm text-muted">No AI employees yet.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {employees.map((e) => {
            const Icon = EMPLOYEE_KIND_ICON[e.kind as EmployeeKind] ?? EMPLOYEE_KIND_ICON.operations;
            return (
              <Link key={e.id} href={`/app/${companyId}/workforce/${e.id}`}>
                <Card className="h-full transition-colors hover:border-accent/40">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-9 items-center justify-center rounded-full bg-surface-muted">
                          <Icon className="size-4" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold">{e.name}</p>
                          <p className="text-xs text-muted">{e.role}</p>
                        </div>
                      </div>
                      <Badge variant={e.status === "active" ? "success" : "outline"}>{e.status}</Badge>
                    </div>

                    <p className="line-clamp-2 text-xs text-muted">
                      {e.currentTask ? `Working on: ${e.currentTask}` : e.lastActivity ?? "No activity yet."}
                    </p>

                    <div className="flex items-center justify-between text-xs text-muted">
                      <span>{e.tasksCompleted} tasks completed</span>
                      <span>{e.schedule ?? "No schedule"}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create an AI employee</DialogTitle>
          </DialogHeader>
          <form onSubmit={createEmployee} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="emp-name">Name</Label>
              <Input id="emp-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Growth" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emp-role">Role</Label>
              <Input id="emp-role" required value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. AI Growth Marketer" />
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as EmployeeKind)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EMPLOYEE_KIND_LABEL).map(([k, label]) => (
                    <SelectItem key={k} value={k}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emp-goal">Goal</Label>
              <Textarea id="emp-goal" rows={2} value={goal} onChange={(e) => setGoal(e.target.value)} />
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
    </>
  );
}
