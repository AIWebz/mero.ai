"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface IntegrationItem {
  provider: string;
  name: string;
  description: string;
  status: string;
}

export function IntegrationsView({ items }: { items: IntegrationItem[] }) {
  const [active, setActive] = useState<IntegrationItem | null>(null);

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <Card key={item.provider}>
            <CardContent className="flex items-start justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-medium">{item.name}</p>
                <p className="mt-0.5 text-xs text-muted">{item.description}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <Badge variant="outline">Not connected</Badge>
                <Button size="sm" variant="outline" onClick={() => setActive(item)}>
                  Connect
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect {active?.name}</DialogTitle>
            <DialogDescription>{active?.description}</DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-3 rounded-lg border border-border bg-surface-muted p-4 text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-muted" />
            <p>
              This integration isn&apos;t wired up to a live connection in this environment yet. When it is, this is
              where you&apos;d authorize Mero to access {active?.name} on the company&apos;s behalf.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActive(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
