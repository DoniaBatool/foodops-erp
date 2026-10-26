# FoodOps ERP: Claude working notes

@AGENTS.md

Custom multi-tenant ERP for small UK/US food & drink producers (stock with lots and expiry, recipes and costing,
production batches, traceability with mock recall, wholesale orders, Xero sync). Owner: Donia Batool.

## Read first, every session

1. `PROGRESS.md`: current phase, what is done, what is blocked on Donia.
2. `DECISIONS.md`: decisions already made. Do not reopen them without asking Donia.
3. `food-drink-erp-guide.md`: the full spec (source of truth). Read the relevant section before writing code.
4. `project-context.md`: product context and status log.

## Phases

Each week of the 6-week MVP plan (spec section 13) is one phase.

| Phase | Week | Scope |
|---|---|---|
| P1 | 1 | Foundation: setup, DB, auth, orgs, org context, master data, units/codes, CI |
| P2 | 2 | Goods In and Inventory |
| P3 | 3 | Recipes, costing and production |
| P4 | 4 | Orders, dispatch, traceability and mock recall |
| P5 | 5 | Xero integration |
| P6 | 6 | Dashboard, polish, E2E tests, launch |

## How to work

- Follow the phases in order and build one feature at a time. Build MVP scope only (spec section 3). For anything out of scope, say so in one line and ask whether to add it now or later.
- Before a big change (new table, schema change, new library, changing a past decision), explain it briefly and wait for Donia's OK.
- When something is unclear, ask one short question instead of guessing.
- Talk to Donia in simple Roman Urdu, with technical terms in English. Keep it direct and step by step. She prefers exact commands and clicks.
- Code, comments and commit messages are in English. Give complete files with paths. After code, list the files changed, the commands to run and how to test manually.

## Engineering rules (never break)

- TypeScript strict. Zod on every form and server input.
- Multi-tenancy: every table has `org_id`, and every server query goes through `getOrgContext()` (`lib/org-context.ts`). Never trust an org id from the browser. Drizzle bypasses RLS, so scope queries in code. RLS stays on as a second layer.
- Stock changes only inside Postgres stock functions. Guard triggers reject direct edits to `lots.qty_on_hand` or `stock_movements`. `stock_movements` is the ledger.
- Quantities are stored in base units (g, ml, each); conversions happen in the UI only. Money and quantities are `numeric` in Postgres and `decimal.js` on the server, never JS floats.
- Completed batches and dispatched orders are never deleted, only reversed. `audit_log` is written by triggers.
- Xero: OAuth 2.0 granular scopes, encrypted tokens, idempotency key on every push, DRAFT invoices by default, respect `Retry-After`.
- UI uses the tokens, components and status colours in spec section 5. Show units with every quantity. Goods In and Production screens must work on a tablet.
- Tests: Vitest for costing, units, FEFO, codes and Xero mapping; Playwright for the main flow.

## Project-specific overrides

These win over generic skills or global habits:

- **Package manager is npm** (a `package-lock.json` exists). Do not switch to pnpm.
- **UI style comes from spec section 5:** calm, practical, tablet-friendly. No cinematic, scroll-scrubbed or 3D effects in the app. Generic UI skills may be used for polish only within these tokens.
- **Next.js 16:** `proxy.ts` (not middleware), Cache Components are on, and each page owns its `<Suspense>` boundary around session or URL data. Read `node_modules/next/dist/docs/` before using a Next API.
- **Migrations** are SQL files in `supabase/migrations/` named `<timestamp>_<name>.sql`, and they must match the Supabase migration history. Drizzle (`db/schema/`) mirrors them for typed queries; never use `drizzle-kit generate` or `push`.
- **Network:** `ui.shadcn.com`, Google Fonts and `*.supabase.co` are blocked from Claude's workspace. Copy shadcn components from the shadcn GitHub repo; Donia tests anything that needs Supabase at runtime on her Mac.
- **`.env.local`** cannot be written by Claude's remote tools. Donia edits it herself (template: `.env.example`).

## When a phase is finished

As soon as the last step of a phase is done and its tests pass, tell Donia in the chat, in simple Roman Urdu, before anything else:

1. "Phase Px complete", with what was built and the test result, including anything only Donia can verify on her Mac or phone.
2. What she must do herself before the next phase (accounts, keys, devices), copied from "Blocked / needs Donia" in `PROGRESS.md`.
3. A ready-to-paste first message for a new session, in this form:
   `Phase Px+1 shuru karo: <phase name>. PROGRESS.md aur DECISIONS.md padho, 3-4 line mein batao hum kahan hain, phir /project-workflow chalao.`

Then:
- Mark the phase done in `PROGRESS.md` (table, overall %, session log).
- Give a Status log row for `project-context.md` and update it in project knowledge.

Nothing needs to be added to the Claude Project instructions: new sessions read `CLAUDE.md` and `PROGRESS.md` first.
