# FoodOps ERP: Decisions

Decisions already made. Do not change one without asking Donia first. Newest at the top.

| Date | Decision | Why | Where |
|---|---|---|---|
| 2026-10-22 | Each week of the 6-week plan = one phase (P1–P6); phase handoff rules live in `CLAUDE.md` | Start each phase in a fresh session with full context | `CLAUDE.md`, `PROGRESS.md` |
| 2026-10-22 | Pages wrap session or URL data in their own `<Suspense>`; the static shell renders first | Next.js 16 Cache Components and instant-navigation validation | `app/(app)`, `app/(auth)` |
| 2026-10-22 | `proxy.ts` refreshes the Supabase session and does optimistic redirects; real checks live in `getOrgContext()` | Next 16 renamed middleware to proxy; proxy is not a security boundary | `proxy.ts`, `lib/org-context.ts` |
| 2026-10-22 | Active org is a cookie (`foodops_org`) used only as a preference, always re-checked against `org_members` | Never trust an org id from the browser | `lib/org-context.ts` |
| 2026-10-22 | Supabase Auth with email + password; publishable key on the client, Drizzle on the server for data | Auth built in; one dashboard; no extra auth library | `lib/supabase/*`, `server/actions/auth.ts` |
| 2026-10-22 | shadcn/ui "new-york" (Radix) components, copied from the shadcn GitHub repo | `ui.shadcn.com` blocked in Claude's workspace; same files as the CLI | `components/ui/` |
| 2026-10-22 | Terracotta is `--brand-accent`, not shadcn `--accent` (hover background) | Avoid orange hover on every menu | `app/globals.css` |
| 2026-10-22 | `is_org_member()` moved to the `app_private` schema; every function has a pinned `search_path` | Supabase security advisor | `supabase/migrations/20261022052438_security_hardening.sql` |
| 2026-10-22 | Migration files use Supabase timestamp names to match the remote history | Applied through the Supabase connector | `supabase/migrations/` |
| 2026-10-21 | Stay on Supabase (not Neon) | Schema and RLS use Supabase Auth; auth and storage built in | `project-context.md` |
| 2026-10-21 | Supabase project settings: "Automatically expose new tables" off, "automatic RLS" on | Browser never reads tables directly; RLS by default | Supabase dashboard |
| 2026-10-19 | One folder = one Git repo (`FoodOps ERP/`), private GitHub repo `DoniaBatool/foodops-erp` | Donia's request | repo root |
| 2026-10-19 | MVP: no stock reservation on confirmed orders; no partial dispatch; DRAFT Xero invoices with a setting; opening stock import in the P6 onboarding pack | Agreed after review of spec section 17 | spec 8.7, 9, 13 |
| 2026-10-19 | Schema per spec 7.4: composite FKs on `(org_id, id)`, base-unit quantities `numeric(18,3)`, unit costs `numeric(20,8)` | Tenant safety at DB level; precision for cost per gram | spec 7 |
| 2026-10-19 | SQL migrations are the source of truth (Supabase CLI or connector); Drizzle mirrors them; no `drizzle-kit generate` | RLS, triggers and stock functions are easier to own in SQL | spec 4, 7.3 |
| 2026-10-19 | Spec rebuilt as `food-drink-erp-guide.md` v2.0 after the original was lost | Section 17 lists what was re-derived | spec |
| (earlier) | Niche, MVP scope, stack, theme (cream / sage `#2F5D50` / terracotta `#C8693F`, Inter), Xero rules, demo company Hillside Bakehouse Ltd (fictional) | See `project-context.md` | `project-context.md` |
