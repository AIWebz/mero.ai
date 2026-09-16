"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MemoryEntry {
  id: string;
  key: string;
  category: string;
  content: string;
}

interface Doc {
  id: string;
  title: string;
  category: string;
  content: string;
}

export function KnowledgeView({
  companyId,
  memory,
  docs,
}: {
  companyId: string;
  memory: MemoryEntry[];
  docs: Doc[];
}) {
  const router = useRouter();
  const [editingMemory, setEditingMemory] = useState<string | null>(null);
  const [memoryDraft, setMemoryDraft] = useState("");
  const [docOpen, setDocOpen] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docCategory, setDocCategory] = useState("general");
  const [docContent, setDocContent] = useState("");
  const [savingDoc, setSavingDoc] = useState(false);

  async function saveMemory(id: string) {
    await fetch(`/api/companies/${companyId}/memory/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: memoryDraft }),
    });
    setEditingMemory(null);
    router.refresh();
  }

  async function deleteMemory(id: string) {
    await fetch(`/api/companies/${companyId}/memory/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function createDoc(e: React.FormEvent) {
    e.preventDefault();
    setSavingDoc(true);
    await fetch(`/api/companies/${companyId}/knowledge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: docTitle, category: docCategory, content: docContent }),
    });
    setSavingDoc(false);
    setDocOpen(false);
    setDocTitle("");
    setDocContent("");
    router.refresh();
  }

  async function deleteDoc(id: string) {
    await fetch(`/api/companies/${companyId}/knowledge/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <Tabs defaultValue="memory">
      <TabsList>
        <TabsTrigger value="memory">Company memory</TabsTrigger>
        <TabsTrigger value="docs">Documents</TabsTrigger>
      </TabsList>

      <TabsContent value="memory">
        {memory.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center text-sm text-muted">Nothing remembered yet.</CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {memory.map((m) => (
                <div key={m.id} className="p-4">
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{m.key.replace(/_/g, " ")}</span>
                      <Badge variant="outline">{m.category}</Badge>
                    </div>
                    {editingMemory === m.id ? (
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="size-7" onClick={() => saveMemory(m.id)}>
                          <Check className="size-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="size-7" onClick={() => setEditingMemory(null)}>
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7"
                          onClick={() => {
                            setEditingMemory(m.id);
                            setMemoryDraft(m.content);
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="size-7" onClick={() => deleteMemory(m.id)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {editingMemory === m.id ? (
                    <Textarea value={memoryDraft} onChange={(e) => setMemoryDraft(e.target.value)} rows={3} />
                  ) : (
                    <p className="whitespace-pre-wrap text-sm text-muted">{m.content}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="docs">
        <div className="mb-3 flex justify-end">
          <Button variant="accent" onClick={() => setDocOpen(true)}>
            <Plus className="size-4" />
            New document
          </Button>
        </div>
        {docs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center text-sm text-muted">No documents yet.</CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {docs.map((d) => (
              <Card key={d.id}>
                <CardContent className="p-4">
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{d.title}</p>
                      <Badge variant="outline">{d.category.replace("_", " ")}</Badge>
                    </div>
                    <Button size="icon" variant="ghost" className="size-7" onClick={() => deleteDoc(d.id)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-muted">{d.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <Dialog open={docOpen} onOpenChange={setDocOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New knowledge document</DialogTitle>
          </DialogHeader>
          <form onSubmit={createDoc} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="doc-title">Title</Label>
              <Input id="doc-title" required value={docTitle} onChange={(e) => setDocTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={docCategory} onValueChange={setDocCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="business_plan">Business plan</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-content">Content</Label>
              <Textarea id="doc-content" rows={6} required value={docContent} onChange={(e) => setDocContent(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDocOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="accent" disabled={savingDoc}>
                {savingDoc ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
