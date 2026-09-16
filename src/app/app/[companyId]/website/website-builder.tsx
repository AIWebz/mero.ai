"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Monitor, Smartphone, Sparkles, Trash2, Pencil, Plus, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Section {
  id: string;
  kind: string;
  heading: string;
  body: string;
  items?: string[];
}

interface Page {
  id: string;
  slug: string;
  title: string;
  sections: Section[];
}

function SectionPreview({ section }: { section: Section }) {
  switch (section.kind) {
    case "hero":
      return (
        <div className="rounded-lg bg-surface-muted px-8 py-16 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">{section.heading}</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">{section.body}</p>
        </div>
      );
    case "cta":
      return (
        <div className="rounded-lg bg-foreground px-8 py-12 text-center text-background">
          <h3 className="text-xl font-semibold">{section.heading}</h3>
          <p className="mt-2 text-background/70">{section.body}</p>
        </div>
      );
    case "features":
    case "products":
      return (
        <div className="px-2 py-8">
          <h3 className="text-center text-xl font-semibold">{section.heading}</h3>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {(section.items ?? []).map((item, i) => (
              <div key={i} className="rounded-md border border-border p-4 text-sm">
                {item}
              </div>
            ))}
          </div>
        </div>
      );
    case "contact_form":
      return (
        <div className="px-2 py-8">
          <h3 className="text-center text-xl font-semibold">{section.heading}</h3>
          <p className="text-center text-muted">{section.body}</p>
          <div className="mx-auto mt-6 max-w-sm space-y-3">
            <div className="h-9 rounded-md border border-border bg-surface-muted" />
            <div className="h-9 rounded-md border border-border bg-surface-muted" />
            <div className="h-20 rounded-md border border-border bg-surface-muted" />
          </div>
        </div>
      );
    default:
      return (
        <div className="px-2 py-8">
          <h3 className="text-xl font-semibold">{section.heading}</h3>
          <p className="mt-2 whitespace-pre-wrap text-muted">{section.body}</p>
        </div>
      );
  }
}

export function WebsiteBuilder({ companyId, pages }: { companyId: string; pages: Page[] }) {
  const router = useRouter();
  const [activePageId, setActivePageId] = useState(pages[0].id);
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ heading: string; body: string }>({ heading: "", body: "" });
  const [command, setCommand] = useState("");
  const [running, setRunning] = useState(false);
  const [commandResult, setCommandResult] = useState<string | null>(null);
  const [addKind, setAddKind] = useState("text");

  const activePage = pages.find((p) => p.id === activePageId)!;

  async function saveSection(sectionId: string) {
    await fetch(`/api/companies/${companyId}/website/pages/${activePageId}/sections/${sectionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    setEditingId(null);
    router.refresh();
  }

  async function deleteSection(sectionId: string) {
    await fetch(`/api/companies/${companyId}/website/pages/${activePageId}/sections/${sectionId}`, { method: "DELETE" });
    router.refresh();
  }

  async function addSection() {
    await fetch(`/api/companies/${companyId}/website/pages/${activePageId}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: addKind, heading: "New section", body: "" }),
    });
    router.refresh();
  }

  async function runCommand(e: React.FormEvent) {
    e.preventDefault();
    if (!command.trim()) return;
    setRunning(true);
    setCommandResult(null);
    const res = await fetch(`/api/companies/${companyId}/website/command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId: activePageId, command }),
    });
    const data = await res.json();
    setCommandResult(data.message);
    setRunning(false);
    setCommand("");
    if (data.ok) router.refresh();
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <aside className="w-56 shrink-0 space-y-1 overflow-y-auto border-r border-border p-4">
        <p className="mb-2 text-xs font-semibold text-muted">Pages</p>
        {pages.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePageId(p.id)}
            className={cn(
              "block w-full rounded-md px-3 py-1.5 text-left text-sm",
              p.id === activePageId ? "bg-accent/10 text-accent font-medium" : "text-muted hover:bg-surface-muted",
            )}
          >
            {p.title}
            <span className="ml-1.5 text-xs opacity-60">{p.slug}</span>
          </button>
        ))}
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <div className="flex items-center gap-1">
            <Button size="icon" variant={viewport === "desktop" ? "outline" : "ghost"} className="size-7" onClick={() => setViewport("desktop")}>
              <Monitor className="size-3.5" />
            </Button>
            <Button size="icon" variant={viewport === "mobile" ? "outline" : "ghost"} className="size-7" onClick={() => setViewport("mobile")}>
              <Smartphone className="size-3.5" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Select value={addKind} onValueChange={setAddKind}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="features">Features</SelectItem>
                <SelectItem value="cta">CTA</SelectItem>
                <SelectItem value="about">About</SelectItem>
                <SelectItem value="products">Products</SelectItem>
                <SelectItem value="contact_form">Contact form</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={addSection}>
              <Plus className="size-3.5" />
              Add section
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-surface-muted/40 p-6">
          <div className={cn("mx-auto space-y-4 transition-all", viewport === "mobile" ? "max-w-sm" : "max-w-3xl")}>
            {activePage.sections.map((section) => (
              <div key={section.id} className="group relative rounded-lg border border-border bg-surface">
                <div className="absolute top-2 right-2 z-10 hidden gap-1 group-hover:flex">
                  {editingId === section.id ? (
                    <>
                      <Button size="icon" variant="outline" className="size-7 bg-surface" onClick={() => saveSection(section.id)}>
                        <Check className="size-3.5" />
                      </Button>
                      <Button size="icon" variant="outline" className="size-7 bg-surface" onClick={() => setEditingId(null)}>
                        <X className="size-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="icon"
                        variant="outline"
                        className="size-7 bg-surface"
                        onClick={() => {
                          setEditingId(section.id);
                          setDraft({ heading: section.heading, body: section.body });
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button size="icon" variant="outline" className="size-7 bg-surface" onClick={() => deleteSection(section.id)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </>
                  )}
                </div>
                {editingId === section.id ? (
                  <div className="space-y-2 p-4">
                    <Input value={draft.heading} onChange={(e) => setDraft({ ...draft, heading: e.target.value })} placeholder="Heading" />
                    <Textarea value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} placeholder="Body" rows={3} />
                  </div>
                ) : (
                  <SectionPreview section={section} />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={runCommand} className="border-t border-border p-3">
          {commandResult && <p className="mb-2 px-1 text-xs text-muted">{commandResult}</p>}
          <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
            <Sparkles className="size-4 shrink-0 text-accent" />
            <Input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder='Ask AI to edit this page — "Make the homepage feel more premium."'
              className="border-none px-0 shadow-none focus-visible:ring-0"
              disabled={running}
            />
            <Button type="submit" size="sm" variant="accent" disabled={running || !command.trim()}>
              {running ? <Loader2 className="size-3.5 animate-spin" /> : "Apply"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
