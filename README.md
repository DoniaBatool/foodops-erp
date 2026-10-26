# FoodOps ERP

Custom multi-tenant ERP for small food & drink producers: stock with lots and expiry, recipes and costing,
production batches, traceability with mock recall, wholesale orders and Xero sync.

- **Spec:** `food-drink-erp-guide.md` (source of truth)
- **Decisions & status:** `project-context.md`

## Stack

Next.js 16 (App Router, Cache Components) · TypeScript strict · Supabase (Postgres, Auth, London) ·
Drizzle ORM · Tailwind CSS 4 + shadcn/ui · React Hook Form + Zod · decimal.js · Vitest · Playwright.

## Local setup

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                   # http://localhost:3000
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types + `tsc --noEmit` |
| `npm test` | Vitest unit tests |

## Database

SQL migrations live in `supabase/migrations/` and are the source of truth (RLS, triggers, stock functions).
`db/schema/` mirrors them for typed Drizzle queries. Drizzle connects with a role that bypasses RLS,
so every query must be scoped with `getOrgContext()` (`lib/org-context.ts`).

Stock quantities change only inside Postgres stock functions; guard triggers reject direct edits.
