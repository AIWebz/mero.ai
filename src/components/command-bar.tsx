"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const EXAMPLES = [
  "What is hurting our sales?",
  "Have marketing create a campaign",
  "Give me today's company report",
  "Find our biggest missed opportunity",
];

export function CommandBar({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) {
      // Reset the dialog's local state when it closes — intentional, not a derived-state update.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue("");
      setReply(null);
    }
  }, [open]);

  async function submit(command: string) {
    if (!command.trim()) return;
    setLoading(true);
    setReply(null);
    try {
      const res = await fetch(`/api/companies/${companyId}/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });
      const data = await res.json();
      setReply(data.message ?? data.error ?? "Something went wrong.");
      if (data.taskId) router.refresh();
    } catch {
      setReply("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full max-w-sm items-center gap-2 rounded-md border border-border bg-surface-muted px-3 py-1.5 text-sm text-muted hover:bg-surface"
      >
        <Search className="size-3.5" />
        <span className="flex-1 text-left">Ask Mero anything…</span>
        <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 text-[10px]">⌘K</kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl gap-0 p-0">
          <DialogTitle className="sr-only">Command Mero</DialogTitle>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(value);
            }}
            className="flex items-center gap-2 border-b border-border p-4"
          >
            <Search className="size-4 text-muted" />
            <Input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Get more customers, build a new landing page, why did revenue drop…"
              className="border-none px-0 shadow-none focus-visible:ring-0"
            />
            {loading ? (
              <Loader2 className="size-4 animate-spin text-muted" />
            ) : (
              <CornerDownLeft className="size-4 text-muted" />
            )}
          </form>

          <div className="max-h-80 overflow-y-auto p-4">
            {reply ? (
              <p className="text-sm leading-relaxed">{reply}</p>
            ) : (
              <div className="space-y-1">
                <p className="mb-2 text-xs font-medium text-muted">Try asking</p>
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => {
                      setValue(ex);
                      submit(ex);
                    }}
                    className="block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-surface-muted"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
