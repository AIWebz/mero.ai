"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Building2,
  Users,
  ListChecks,
  ShieldCheck,
  Activity,
  Globe,
  BarChart3,
  BookOpen,
  Plug,
  Settings,
  ChevronsUpDown,
  Plus,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommandBar } from "@/components/command-bar";

interface CompanySummary {
  id: string;
  name: string;
  status: string;
}

const nav = (companyId: string) => [
  { href: `/app/${companyId}`, label: "Overview", icon: LayoutDashboard, exact: true },
  { href: `/app/${companyId}/company`, label: "Company", icon: Building2 },
  { href: `/app/${companyId}/workforce`, label: "Workforce", icon: Users },
  { href: `/app/${companyId}/tasks`, label: "Tasks", icon: ListChecks },
  { href: `/app/${companyId}/approvals`, label: "Approvals", icon: ShieldCheck },
  { href: `/app/${companyId}/activity`, label: "Activity", icon: Activity },
  { href: `/app/${companyId}/website`, label: "Website", icon: Globe },
  { href: `/app/${companyId}/analytics`, label: "Analytics", icon: BarChart3 },
  { href: `/app/${companyId}/knowledge`, label: "Knowledge", icon: BookOpen },
  { href: `/app/${companyId}/integrations`, label: "Integrations", icon: Plug },
  { href: `/app/${companyId}/settings`, label: "Settings", icon: Settings },
];

export function AppShell({
  companies,
  currentCompany,
  userName,
  pendingApprovals,
  children,
}: {
  companies: CompanySummary[];
  currentCompany: { id: string; name: string };
  userName: string;
  pendingApprovals: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const items = nav(currentCompany.id);
  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface">
        <div className="p-4">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-muted">
              <span className="truncate font-medium">{currentCompany.name}</span>
              <ChevronsUpDown className="size-3.5 shrink-0 text-muted" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Your companies</DropdownMenuLabel>
              {companies.map((c) => (
                <DropdownMenuItem key={c.id} onSelect={() => router.push(`/app/${c.id}`)}>
                  <span className="flex-1 truncate">{c.name}</span>
                  {c.id === currentCompany.id && <span className="size-1.5 rounded-full bg-accent" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => router.push("/onboarding")}>
                <Plus className="size-4" />
                New company
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
          {items.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                  active ? "bg-accent/10 text-accent font-medium" : "text-muted hover:bg-surface-muted hover:text-foreground",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <item.icon className="size-4" />
                  {item.label}
                </span>
                {item.label === "Approvals" && pendingApprovals > 0 && (
                  <Badge variant="accent" className="px-1.5 py-0 text-[10px]">
                    {pendingApprovals}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-surface-muted">
              <Avatar className="size-7">
                <AvatarFallback>{initials || "U"}</AvatarFallback>
              </Avatar>
              <span className="flex-1 truncate text-sm">{userName}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52">
              <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/" })}>
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center border-b border-border bg-background px-6">
          <CommandBarTrigger companyId={currentCompany.id} />
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

function CommandBarTrigger({ companyId }: { companyId: string }) {
  return <CommandBar companyId={companyId} />;
}
