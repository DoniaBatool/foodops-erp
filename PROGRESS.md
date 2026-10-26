# FoodOps ERP: Progress

**Current phase:** P1 (Week 1, Foundation), in progress
**Overall MVP progress:** about 8% (P1 is about 50% done; each phase counts as one sixth of the MVP)
**Last updated:** 2026-10-22

## Phases

| Phase | Week | Scope | Status | Done |
|---|---|---|---|---|
| P1 | 1 | Foundation | 🟡 In progress | ~50% |
| P2 | 2 | Goods In and Inventory | ⚪ Not started | 0% |
| P3 | 3 | Recipes, costing and production | ⚪ Not started | 0% |
| P4 | 4 | Orders, dispatch, traceability, mock recall | ⚪ Not started | 0% |
| P5 | 5 | Xero integration | ⚪ Not started | 0% |
| P6 | 6 | Dashboard, polish, E2E, launch | ⚪ Not started | 0% |

## P1 checklist (spec section 13, Week 1)

### Build

- [x] Next.js 16 app, Tailwind 4, shadcn/ui components, design tokens (spec 5), Inter font
- [x] Supabase project in London (`qdaekacnubihqislfafs`); init + security_hardening migrations applied
- [x] Drizzle schema mirroring the migrations (`db/schema/`), `db/index.ts`
- [x] Auth: signup, login, logout, forgot/reset password, email link handling (`/auth/confirm`)
- [x] Onboarding: create organisation, owner membership, 5 default locations
- [x] `getOrgContext()`, `requireRole()`, `withOrgTx()`; org switcher in user menu
- [x] App shell (sidebar nav, top bar), dashboard placeholder
- [ ] Invite users (admin API, roles)
- [ ] Items CRUD with pack units; Suppliers, Customers, Locations CRUD (Zod validation)
- [ ] `lib/units.ts` + `lib/codes.ts` with Vitest tests
- [ ] CI (lint, typecheck, Vitest) on GitHub Actions
- [ ] Vercel preview deploy, Sentry

### Acceptance

- [x] Migrations apply cleanly (applied to Supabase, smoke-tested)
- [x] RLS on every table; anon cannot read; a user reads only their own org (tested on a test DB; RLS on in Supabase)
- [x] A direct `UPDATE lots.qty_on_hand` fails; a direct `INSERT stock_movements` fails (tested on Supabase)
- [x] Composite FKs reject cross-org links (tested on Supabase)
- [ ] New user can sign up, create an org and land on the dashboard (**Donia to verify on Mac**)
- [ ] Invited user joins with the right role
- [ ] Two orgs cannot see each other's items (app level)
- [ ] Items CRUD shows units with every quantity; Zod field errors
- [ ] Unit and code tests pass; CI green; preview deploy works

## Blocked / needs Donia

- [ ] Run signup → create workspace → dashboard on the Mac and confirm rows in Supabase (`organisations`, `org_members`, `locations`)
- [ ] Before invites: add `SUPABASE_SECRET_KEY` to `.env.local` (Supabase > Project Settings > API Keys)
- [ ] Before the preview deploy: Vercel account connected to the GitHub repo `DoniaBatool/foodops-erp`
- [ ] Before Sentry: a Sentry account (free plan) and project DSN
- [ ] Later (P5): Xero developer account and app

## Session log

| Date | Phase | What happened |
|---|---|---|
| 2026-10-19 | P1 | Spec lost and rebuilt as guide v2.0. Next.js app scaffolded. Folder flattened into one repo. `0001_init.sql` written and tested on a throwaway Postgres. |
| 2026-10-21 | P1 | Supabase project created (London). Pushed the repo to GitHub (private). |
| 2026-10-22 | P1 | Migrations applied through the Supabase connector + security hardening (advisor clean except an intentional INFO). Built auth, onboarding, org context, app shell, design tokens, Drizzle schema. Fixed the Next 16 "instant navigation" error on `/login`. Added `CLAUDE.md`, `PROGRESS.md`, `DECISIONS.md`. |
