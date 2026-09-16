import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  LayoutTemplate,
  Users,
  Rocket,
  Activity,
  Eye,
  ShieldCheck,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";

const flow = [
  { label: "Your idea" },
  { label: "Mero builds it" },
  { label: "AI workforce" },
  { label: "Your company runs" },
  { label: "AI optimizes it" },
];

const features = [
  {
    icon: Sparkles,
    title: "Generate your company",
    body: "Describe what you want to build. Mero designs the business — name, positioning, target customer, pricing, and goals.",
  },
  {
    icon: LayoutTemplate,
    title: "Build your infrastructure",
    body: "A real website with editable pages, sections, and copy — not a mockup. Structure you can open and change.",
  },
  {
    icon: Users,
    title: "Hire your AI workforce",
    body: "Mero assembles the AI employees this specific business needs, each with a role, goals, and clear permissions.",
  },
  {
    icon: Rocket,
    title: "Launch",
    body: "Everything comes together into a working company workspace, ready to operate from day one.",
  },
  {
    icon: Activity,
    title: "Let AI operate it",
    body: "Your AI CEO coordinates the workforce, delegates work, and keeps the company moving toward its goals.",
  },
  {
    icon: Eye,
    title: "Monitor everything",
    body: "Every real action your AI workforce takes shows up as activity — transparent, timestamped, auditable.",
  },
  {
    icon: ShieldCheck,
    title: "Approve important decisions",
    body: "Sensitive actions — publishing, spending, sending — wait for your approval. You stay in control.",
  },
];

export default async function Home() {
  const session = await auth();
  const primaryHref = session?.user ? "/onboarding" : "/signup";

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight">Mero</span>
          <nav className="hidden items-center gap-8 text-sm text-muted sm:flex">
            <a href="#how-it-works" className="hover:text-foreground">
              How it works
            </a>
            <a href="#what-mero-does" className="hover:text-foreground">
              What Mero does
            </a>
          </nav>
          <div className="flex items-center gap-3">
            {session?.user ? (
              <Button asChild size="sm" variant="outline">
                <Link href="/app">Go to dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild size="sm" variant="ghost">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild size="sm" variant="accent">
                  <Link href="/signup">Sign up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-6 pt-20 pb-16 text-center sm:pt-28">
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Build a company. Let AI run it.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted text-balance">
            Mero turns your idea into a real business, builds the infrastructure, and gives it an
            AI workforce to operate and grow it.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="accent">
              <Link href={primaryHref}>
                Build My Company
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#how-it-works">See How It Works</a>
            </Button>
          </div>
        </section>

        {/* Flow diagram */}
        <section id="how-it-works" className="border-y border-border bg-surface-muted/60 py-16">
          <div className="mx-auto max-w-5xl px-6">
            <div className="flex flex-col items-center gap-2">
              {flow.map((step, i) => (
                <div key={step.label} className="flex flex-col items-center gap-2">
                  <div className="rounded-full border border-border bg-surface px-6 py-2.5 text-sm font-medium shadow-xs">
                    {step.label}
                  </div>
                  {i < flow.length - 1 && <ArrowDown className="size-4 text-muted" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="what-mero-does" className="mx-auto max-w-6xl px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              An AI company operating system
            </h2>
            <p className="mt-3 text-muted">
              Not a chatbot. Not a website builder. Mero designs, builds, staffs, and runs the
              company with you.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-lg border border-border bg-surface p-6">
                <f.icon className="size-5 text-accent" />
                <h3 className="mt-4 text-sm font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-3xl px-6 py-20 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Describe a company. Mero builds it. Mero operates it.
            </h2>
            <div className="mt-8">
              <Button asChild size="lg" variant="accent">
                <Link href={primaryHref}>
                  Build My Company
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-sm text-muted">
          <span>Mero</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
