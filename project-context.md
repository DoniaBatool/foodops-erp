# FoodOps ERP: Project Context

## Who I am
- Donia Batool, full-stack / AI automation developer based in Pakistan, working remotely.
- I build custom systems for UK and US small businesses (CRMs, automation, AI agents).
- Comfortable with Next.js, TypeScript, Supabase, Drizzle, Node.js, Python/FastAPI, OpenAI Agents SDK, Vercel.

## What we are building
A small, custom, multi-tenant ERP for **small food & drink producers** (bakeries, sauces & preserves, snacks & confectionery, coffee roasters, ready meals, later craft breweries/distilleries).
- Market: **UK first**, US second.
- It runs operations (stock, lots, recipes & costing, production batches, traceability, wholesale orders) and **syncs finance to Xero** (QuickBooks later for US). It never replaces the accounting software.
- Selling point: true cost per product, full batch traceability, and a mock recall report in under a minute.
- Business model: a reusable core (70–80% the same for every client) + 20–30% customisation per client, sold as setup fee + monthly subscription, starting with paid pilots.

## Source of truth
`food-drink-erp-guide.md` (in project knowledge) is the full spec: MVP scope, tech stack, design tokens, screens, SQL schema, business logic, Xero integration, folder structure, seed data, 6-week plan, roadmap and lead generation. If anything here conflicts with that guide, the guide wins, unless I say otherwise in chat.

## Key decisions already made
- Target niche: small food & drink producers, UK first.
- MVP = Auth/orgs, Items, Goods In, Inventory (lots + expiry), Recipes & costing, Production batches, Traceability + Mock Recall PDF, Customers & Orders, Xero sync, Dashboard, CSV export.
- Not in MVP: purchase orders, HACCP/quality, allergens UI, labels, Shopify/Faire, QuickBooks, alcohol duty, AI features.
- Stack: Next.js (App Router) + TypeScript, Supabase Postgres (London region), Drizzle, Tailwind + shadcn/ui, TanStack Table, React Hook Form + Zod, Recharts, Inngest, @react-pdf/renderer, xero-node, Resend, Sentry, Vitest + Playwright, Vercel.
- Theme: warm cream background, deep sage green primary (#2F5D50), terracotta accent (#C8693F), Inter font, tabular numbers for codes and quantities.
- Xero: new app created after 2 March 2026 → granular scopes only; free Starter tier (~5 connections) is enough for first clients; invoices pushed as DRAFT by default; push more, pull less.
- Demo company for seed data: Hillside Bakehouse Ltd (fictional).

## Current status
- Planning done, spec written. Starting Week 1 (foundation) of the 6-week plan.

## Status log (update this as you go)
| Date | Week | Done | Next | Blockers |
|---|---|---|---|---|
| 2026-10-19 | 1 | Spec and project setup | Next.js + Supabase setup, migrations, auth, org context | — |
