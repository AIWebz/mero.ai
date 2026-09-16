# Mero

Describe a company. Mero builds it. Mero operates it.

Mero turns a one-line idea into a real company workspace: a business plan, a brand, a
structurally-editable website, and an AI workforce with explicit roles and permissions that
operates the company under the owner's supervision.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4
- **Prisma** + SQLite for local development (swap the datasource for Postgres in production —
  the schema is provider-agnostic)
- **NextAuth (Auth.js) v5** with credentials auth
- **Anthropic** as the default AI provider, behind an abstraction (`src/lib/ai/provider.ts`) so
  the model/provider can change without touching call sites

## Getting started

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, AUTH_SECRET, and optionally ANTHROPIC_API_KEY
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Running without an AI provider

Mero is fully usable with `ANTHROPIC_API_KEY` unset: company generation falls back to a clearly
labeled default template, employee chat and task execution say plainly that they aren't
connected, and no feature fabricates AI output. This is intentional — see the product principles
in the codebase (`src/lib/ai/`, `src/lib/orchestration/`) before changing that behavior.

## Project structure

- `src/app` — routes: marketing site, auth, onboarding, and the `/app/[companyId]` dashboard
- `src/lib/ai` — the model provider abstraction and company-generation prompts
- `src/lib/orchestration` — the AI CEO, task runner, employee chat, and website editor
- `src/lib/integrations` — the integration catalog and adapter interface (no live integrations
  are wired up yet; every provider starts `not_connected`)
- `src/lib/tools` — the tool abstraction AI employees act through, gated by permission checks
- `prisma/schema.prisma` — the full data model, with company-level isolation throughout
