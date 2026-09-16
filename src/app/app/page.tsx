import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getUserCompanies } from "@/lib/companies";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function AppIndexPage() {
  const user = await requireUser();
  const companies = await getUserCompanies(user.id);

  if (companies.length === 0) redirect("/onboarding");
  if (companies.length === 1) redirect(`/app/${companies[0].id}`);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Your companies</h1>
        <Button asChild variant="accent">
          <Link href="/onboarding">
            <Plus className="size-4" />
            New company
          </Link>
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {companies.map((c) => (
          <Link key={c.id} href={`/app/${c.id}`}>
            <Card className="h-full transition-colors hover:border-accent/40">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{c.name}</CardTitle>
                  <Badge variant={c.status === "active" ? "success" : "outline"}>{c.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm text-muted">{c.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
