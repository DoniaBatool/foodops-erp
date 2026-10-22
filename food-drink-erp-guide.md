# FoodOps ERP: Build & Business Guide

**Product:** FoodOps ERP, a custom multi-tenant ERP for small food & drink producers
**Market:** UK first, US second
**Owner:** Donia Batool
**Version:** 2.0 (rebuilt 2026-10-19)

> **About this version.** The original `food-drink-erp-guide.md` was lost on 2026-10-19. This version was rebuilt from `project-context.md` and the project instructions. Everything recorded there (scope, stack, theme, Xero rules, engineering rules, demo company) is carried over unchanged. Details that had to be re-derived (exact table columns, code formats, seed numbers, pricing figures, week-by-week checklists) are listed in **section 17** so they can be confirmed or corrected. Until confirmed, treat section 17 items as proposals, not decisions.

---

## Contents

1. Product overview
2. Market and users
3. MVP scope
4. Tech stack
5. Design system (tokens, components, status colours)
6. Screens, flows and permissions
7. Data model and SQL schema
8. Business logic
9. Xero integration
10. Security, multi-tenancy and audit
11. Folder structure and conventions
12. Seed data and testing
13. 6-week MVP plan with acceptance checklists
14. Pricing and packaging
15. Roadmap
16. Lead generation, demos and sales process
17. Reconstruction notes and open decisions

---

## 1. Product overview

FoodOps ERP runs the operational side of a small food or drink manufacturer: what came in, what it was made into, what it cost, where it went. It sits next to the accounting system and **syncs finance to Xero** (QuickBooks later for the US). It never replaces the accounting software.

**Core promise (the three selling points):**

1. **True cost per product.** Recipe-based costing using real lot costs, labour and overhead, so the owner sees the margin on every product.
2. **Full batch traceability.** Every finished lot links back to the exact raw-material lots and suppliers, and forward to every customer it was dispatched to.
3. **Mock recall report in under a minute.** Pick a lot and get a PDF showing affected products, quantities, customers and a mass balance.

**Business model:** a reusable core (70–80% the same for every client) plus 20–30% customisation per client. Sold as a setup fee plus a monthly subscription, starting with paid pilots (see section 14).

**What it is not (MVP):** an accounting package, a HACCP/quality system, a label printer, an e-commerce platform or an MRP planning engine. Several of these are on the roadmap (section 15).

---

## 2. Market and users

### 2.1 Target customer (ICP)

- Independent food & drink **manufacturers with 5–100 employees** that **sell wholesale** (to cafés, delis, farm shops, hotels, distributors and independent retailers).
- Segments in priority order: bakeries, sauces & preserves, snacks & confectionery, coffee roasters, ready meals. Craft breweries and distilleries come later, because alcohol duty is out of MVP scope.
- Typical current setup: spreadsheets + Xero + paper goods-in sheets and batch records. Sometimes they already tried an off-the-shelf inventory/MRP tool and found it too generic or too heavy.
- Typical triggers to buy:
  - a retailer or distributor asks for traceability
  - working towards SALSA or BRCGS certification
  - a recall scare
  - growing past what spreadsheets can handle
  - not knowing which products actually make money

### 2.2 Regulatory context (why traceability sells)

- **UK:** food businesses must be able to identify who supplied them and who they supplied ("one step back, one step forward"). This comes from Article 18 of Regulation (EC) No 178/2002 as retained in UK law. Certification schemes such as BRCGS and SALSA also expect regular traceability tests. *Verify the exact current clause wording and time limits before quoting them to a client.*
- **US (later):** the FDA Food Traceability Rule (FSMA section 204) adds Key Data Elements for foods on the Food Traceability List. The original compliance date was 20 January 2026. FDA has proposed moving it to **20 July 2028**, and Congress directed FDA not to enforce it before then. *Check the Federal Register for the final date before US sales work.*

### 2.3 User roles

| Role | Who | Typical tasks |
|---|---|---|
| Owner | Founder / MD | Everything, billing, Xero connection, users |
| Admin | Office / ops manager | Master data, settings, orders, Xero sync review |
| Manager | Production manager | Recipes, production planning, stock adjustments, traceability |
| Operator | Floor staff | Goods In, run production batches, dispatch picking (tablet) |
| Viewer | Accountant / auditor | Read-only, reports, CSV export |

---

## 3. MVP scope

### 3.1 In scope

| # | Module | Summary |
|---|---|---|
| 1 | Auth & organisations | Email/password login, invite users, roles, one user can belong to several orgs |
| 2 | Items | Raw materials, packaging, intermediates, finished goods; base unit; pack sizes; shelf life; reorder point |
| 3 | Suppliers, customers, locations | Simple master data |
| 4 | Goods In | Receive deliveries on a tablet: supplier, items, quantities, supplier lot code, expiry, cost, temperature/condition check. Creates lots. |
| 5 | Inventory | Stock by item and by lot, expiry view, FEFO order, adjustments with reason codes, stock valuation |
| 6 | Recipes & costing | Versioned recipes with yield, waste %, labour and overhead; cost per unit; margin vs sale price; sub-recipes (intermediates) |
| 7 | Production batches | Plan, pick input lots (FEFO suggested), record actual quantities, complete. Creates the output lot at actual cost. Reverse with correcting entries. |
| 8 | Traceability + Mock Recall PDF | Backward and forward trace for any lot; recall report with customers and mass balance |
| 9 | Customers & orders | Wholesale sales orders, lot allocation at dispatch (FEFO), delivery note |
| 10 | Xero sync | OAuth 2.0, push contacts and DRAFT invoices on dispatch, pull invoice status |
| 11 | Dashboard | Stock value, expiring lots, low stock, batches this week, orders to dispatch, sync errors |
| 12 | CSV export | Items, lots/stock, movements, batches, orders, recall data |

### 3.2 Not in MVP (roadmap, section 15)

Purchase orders, HACCP/quality checks beyond the goods-in temperature/condition fields, allergens UI, labels, Shopify/Faire, QuickBooks, alcohol duty, AI features.

When a request falls outside this list: say so in one line and ask whether to add it now or keep it for later.

---

## 4. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript strict | Server Components by default; Server Actions for mutations |
| Database | Supabase Postgres, **London region (eu-west-2)** | UK data residency |
| ORM | Drizzle (`drizzle-orm` + `postgres` driver) | Typed queries. Connects as a server role, so it **bypasses RLS**: scope every query by `org_id` in code. |
| Migrations | Plain SQL in `supabase/migrations/`, applied with the Supabase CLI | RLS, triggers and stock functions are easier to own in SQL. Drizzle schema in `db/schema/` mirrors the SQL. `drizzle-kit generate` is not used. |
| Auth | Supabase Auth via `@supabase/ssr` | Cookie sessions; invites via the admin API |
| UI | Tailwind CSS + shadcn/ui | Tokens in section 5 |
| Tables | TanStack Table | Sorting, filtering, column visibility |
| Forms | React Hook Form + Zod | The same Zod schema validates the server input |
| Money/qty | `decimal.js` on the server, `numeric` in Postgres | Never JS floats for money or quantities |
| Charts | Recharts | Dashboard only |
| Background jobs | Inngest | Xero pushes, retries, nightly jobs |
| PDF | `@react-pdf/renderer` | Mock recall report, delivery note |
| Xero | `xero-node` | OAuth 2.0 + Accounting API |
| Email | Resend | Invites, expiry alerts |
| Errors | Sentry | Scrub PII |
| Tests | Vitest (unit + DB function tests), Playwright (E2E) | Section 12 |
| Hosting | Vercel | Preview deploys per branch |

---

## 5. Design system

### 5.1 Principles

- Warm, calm, practical. Built for people standing in a bakery or a warehouse, often wearing gloves, using a tablet.
- **Every quantity shows its unit** (`12.5 kg`, `240 each`, `3.2 l`). There are never bare numbers.
- Codes, quantities and money use **tabular numbers** so columns line up.
- Colour is never the only signal. Every status has a text label (and an icon where useful).
- Irreversible actions (complete batch, dispatch, post goods-in) use a confirm dialog that summarises what will change.

### 5.2 Colour tokens (light theme, MVP)

shadcn/ui uses CSS variables. Hex values are listed here; convert them to `oklch` in `app/globals.css` if the shadcn template expects that.

| Token | Hex | Use |
|---|---|---|
| `--background` | `#FBF8F2` | Page background (warm cream) |
| `--foreground` | `#1E2B26` | Main text |
| `--card` / `--popover` | `#FFFFFF` | Cards, dialogs, menus |
| `--card-foreground` | `#1E2B26` | |
| `--muted` | `#F2EDE3` | Table header, subtle fills |
| `--muted-foreground` | `#5E6B65` | Secondary text (≈5.3:1 on background) |
| `--border` | `#E3DACB` | Borders, dividers |
| `--input` | `#D9CFBE` | Input borders |
| `--primary` | `#2F5D50` | Deep sage green: primary buttons, active nav, links (≈7.5:1 on white) |
| `--primary-hover` | `#264D42` | Hover/pressed |
| `--primary-foreground` | `#FFFFFF` | Text on primary |
| `--secondary` | `#E8EFEC` | Sage tint: secondary buttons, selected rows |
| `--secondary-foreground` | `#2F5D50` | |
| `--accent` | `#F2EDE3` | **shadcn hover background only.** Do not map terracotta here, or every menu hover turns orange. |
| `--brand-accent` | `#C8693F` | Terracotta: highlights, chart series 2, focus illustrations, large text only (≈3.8:1, fails AA for small text) |
| `--brand-accent-strong` | `#A4532E` | Terracotta for small text/icons (≈5.4:1) |
| `--brand-accent-soft` | `#F6E3D8` | Terracotta tint background |
| `--ring` | `#2F5D50` | Focus ring |
| `--success` / `--success-soft` | `#2E7D4F` / `#E3F1E8` | Available, completed, paid |
| `--warning` / `--warning-soft` | `#B7791F` / `#FBF0DC` | Expiring soon, low stock, quarantine (use `--warning-text #8A5A12` for text) |
| `--danger` / `--danger-soft` | `#B42318` / `#FDE7E5` | Expired, recalled, failed sync, destructive actions |
| `--info` / `--info-soft` | `#2F6690` / `#E2EDF5` | Planned, confirmed, in progress |
| `--chart-1..5` | `#2F5D50`, `#C8693F`, `#2F6690`, `#B7791F`, `#7A8C84` | Recharts series |
| `--radius` | `0.5rem` | Corners |

Dark mode is roadmap. Keep tokens as variables so it can be added without touching components.

### 5.3 Typography

- **Inter** via `next/font/google`.
- Base sizes:
  - Desktop tables: 14 px
  - Forms: 16 px
  - Tablet screens (Goods In, Production, Dispatch): 18 px inputs, 20–24 px key numbers
- `font-variant-numeric: tabular-nums` on quantities, money, dates and codes (utility class `.tnum`).
- Lot/batch/order codes: Inter medium, `tnum`, slight letter-spacing (`tracking-wide`), rendered with the `CodeChip` component.

### 5.4 Layout

- App shell:
  - Left sidebar (collapsible) with the nav sections Dashboard, Goods In, Inventory, Production, Recipes, Orders, Traceability, Items, Suppliers, Customers, Settings
  - Top bar with the org switcher and user menu
- Content max width 1280 px; tables can go full width.
- **Tablet mode** (Goods In, Production run, Dispatch):
  - Single column
  - Min touch target 48 px (primary buttons 56 px)
  - Number inputs with large steppers
  - No hover-only actions
  - Sticky bottom action bar

### 5.5 Core components

| Component | Purpose |
|---|---|
| `AppShell`, `PageHeader` | Layout, title, breadcrumbs, primary action |
| `DataTable` | TanStack Table wrapper: sort, filter, column toggle, CSV export button, empty state |
| `QtyCell` / `QtyInput` | Shows or edits a quantity **with its unit**. Input accepts a chosen UOM and converts to base units on submit. |
| `MoneyCell` | Currency formatting, `tnum`, right-aligned |
| `CodeChip` | Lot/batch/order code, copy on click, links to the trace view |
| `StatusBadge` | Status → colour + label from the rules in 5.6 |
| `ExpiryBadge` | Date + days left, coloured by 5.6 |
| `LotPicker` | List of available lots for an item in FEFO order with qty, expiry and location. Pre-selects the FEFO suggestion. |
| `ConfirmDialog` | Summarises the stock effect before irreversible actions |
| `EmptyState` | Icon + one sentence + primary action |
| `CostBreakdown` | Recipe/batch cost by line, labour, overhead, unit cost, margin |

### 5.6 Status colour rules

| Entity | Status | Colour |
|---|---|---|
| Lot | available | success |
| | quarantine, on_hold | warning |
| | recalled | danger |
| | written_off, depleted (qty 0) | muted |
| Expiry | past `use_by` | danger ("Expired") |
| | past `best_before` | warning ("Past best before") |
| | `use_by` within 3 days or `best_before` within 7 days | warning ("Expires in N days") |
| | otherwise | neutral (muted text) |
| Stock level | at or below reorder point | warning ("Low") |
| | zero | danger ("Out") |
| Batch | planned, in_progress | info |
| | completed | success |
| | cancelled, reversed | muted (reversed shows "Reversed" + reason tooltip) |
| Order | draft | muted |
| | confirmed | info |
| | dispatched | success |
| | cancelled, reversed | muted |
| Xero | not synced | muted |
| | queued | info |
| | DRAFT / AUTHORISED | info |
| | PAID | success |
| | failed | danger |

### 5.7 Formatting rules

- UK:
  - Dates `DD/MM/YYYY`
  - Timezone `Europe/London`
  - Currency `£`
  - Number locale `en-GB`
- US (later): `MM/DD/YYYY`, `$`, `en-US`, optional lb/oz display.
- Quantity display:
  - Show the item's preferred display unit.
  - Auto-scale metric units (`1,250 g` → `1.25 kg`, `1,500 ml` → `1.5 l`) unless the user picks a pack unit.
  - Max 3 decimals; trim trailing zeros.
- Money: 2 decimals for totals. Unit costs can show up to 4 decimals (e.g. `£0.0009 / g` shown as `£0.90 / kg`).

---

## 6. Screens, flows and permissions

### 6.1 Screens

| Route | Screen | Key elements |
|---|---|---|
| `/login`, `/signup`, `/invite/accept` | Auth | Email/password, reset password |
| `/onboarding` | Create organisation | Name, country (GB/US), currency, default VAT rate, first locations |
| `/dashboard` | Dashboard | KPI tiles; expiring lots (7 days); low stock; batches this week; orders to dispatch; Xero sync errors |
| `/items`, `/items/[id]` | Items | List with stock on hand; detail with pack units, lots, recipe cost, movements |
| `/suppliers`, `/customers`, `/settings/locations` | Master data | Simple CRUD |
| `/goods-in`, `/goods-in/new`, `/goods-in/[id]` | Goods In (tablet) | Pick supplier → add lines (item, qty + unit, supplier lot code, expiry, unit cost, temp °C, condition OK) → review → **Post** |
| `/inventory` | Inventory | Tabs: By item, By lot, Expiring. Filters: location, status, type. Adjust stock dialog (manager+). Stock valuation total. |
| `/recipes`, `/recipes/[id]` | Recipes | Version list; editor with lines, yield, waste %, labour, overhead; live `CostBreakdown`; activate version |
| `/production`, `/production/new`, `/production/[id]` | Production | Planned list → batch run screen (tablet): FEFO lot suggestions per input, actual qty, output qty, expiry → **Complete**. Reverse (manager+). |
| `/orders`, `/orders/new`, `/orders/[id]` | Orders | Customer, lines (item, qty + unit, price, VAT) → Confirm → Dispatch screen (FEFO allocation, override) → delivery note PDF; Xero status |
| `/traceability` | Traceability | Search by lot code, supplier lot code or batch code → backward tree, forward tree, timeline |
| `/traceability/recall/[lotId]` | Mock recall | Summary + **Download PDF**; mass balance; customer contact list |
| `/settings/org`, `/settings/users`, `/settings/xero`, `/settings/audit` | Settings | Org details, users & roles, Xero connect/mappings/sync log, audit log viewer |
| `/exports` | CSV exports | One click per dataset |

### 6.2 Main flow (also the Playwright E2E path)

1. Goods In: flour lot received.
2. Recipe for the finished product is active.
3. Production batch consumes the flour lot and creates the finished lot.
4. Sales order confirmed.
5. Dispatch allocates the finished lot.
6. Draft invoice pushed to Xero.
7. Mock recall on the flour lot shows the customer.

### 6.3 Permission matrix

| Action | Owner | Admin | Manager | Operator | Viewer |
|---|---|---|---|---|---|
| View everything in org | ✓ | ✓ | ✓ | ✓ | ✓ |
| Master data (items, suppliers, customers, locations) | ✓ | ✓ | ✓ | — | — |
| Post Goods In | ✓ | ✓ | ✓ | ✓ | — |
| Stock adjustment | ✓ | ✓ | ✓ | — | — |
| Recipes (edit/activate) | ✓ | ✓ | ✓ | — | — |
| Run/complete production batch | ✓ | ✓ | ✓ | ✓ | — |
| Reverse batch / dispatch / goods-in | ✓ | ✓ | ✓ | — | — |
| Create/confirm orders | ✓ | ✓ | ✓ | — | — |
| Dispatch order | ✓ | ✓ | ✓ | ✓ | — |
| Xero connect/disconnect, mappings | ✓ | ✓ | — | — | — |
| Users & roles | ✓ | ✓ (not owners) | — | — | — |
| CSV export, recall report | ✓ | ✓ | ✓ | — | ✓ |

Permissions are enforced on the server (`requireRole()` after `getOrgContext()`). Hiding a button in the UI is a convenience, not security.

---

## 7. Data model and SQL schema

### 7.1 Rules that shape the schema

- **Every business table has `org_id`.** Child tables use **composite foreign keys** `(org_id, parent_id) → parent(org_id, id)`. This stops the database from linking a row in one organisation to a row in another, even if application code has a bug.
- **Quantities are stored in base units** (`g`, `ml`, `each`) as `numeric(18,3)`.
- **Unit costs are per base unit** as `numeric(20,8)`. Flour costs about £0.0009 per gram, so many decimals are needed.
- **Money totals** use `numeric(14,2)`.
- **Pack/purchase units** (e.g. "16 kg sack", "tray of 30") live in `item_uoms` with a factor to base. Standard metric units (kg, g, l, ml) are built into `lib/units.ts` and not stored.
- **Stock is changed only by Postgres functions.** Guard triggers block any direct change to `lots.qty_on_hand`, `lots.unit_cost` or `stock_movements`, unless the transaction has set `foodops.stock_write = 'on'`. Only the stock functions set it.
- **`stock_movements` is the ledger.** It is append-only (no update, no delete). `lots.qty_on_hand` is a cached balance that must always equal the sum of that lot's movements (checked in tests and by a nightly job).
- **Completed batches, posted receipts and dispatched orders are never deleted.** They are reversed with correcting movements.
- **`audit_log`** is written by triggers on `lots`, `goods_receipts`, `production_batches`, `sales_orders` and `sales_order_lines`. The actor comes from `foodops.user_id`, set per transaction by the server.
- **RLS is on for every table.** The `authenticated` role gets `SELECT` only for orgs it belongs to, and no write policies. All writes go through the server (Drizzle). RLS is the second layer of protection.

### 7.2 Entity overview

```
organisations ─┬─ org_members ── auth.users ── profiles
               ├─ locations, suppliers, customers, code_sequences
               ├─ items ── item_uoms
               │    └─ recipes ── recipe_lines ──> items
               ├─ goods_receipts ── goods_receipt_lines ──> lots
               ├─ production_batches ── batch_inputs ──> lots (consumed)
               │          └──────────────────────────> lots (output, lots.production_batch_id)
               ├─ lots ── stock_movements (ledger)
               ├─ sales_orders ── sales_order_lines ── order_allocations ──> lots
               ├─ audit_log
               └─ (migration 0005) xero_connections, xero_mappings, xero_sync_jobs
```

### 7.3 Migration plan

| File | Week | Contents |
|---|---|---|
| `0001_init.sql` | 1 | Enums, all core tables (7.4), indexes, guard triggers, audit triggers, `updated_at` triggers, `fn_next_code`, RLS |
| `0002_goods_in_stock.sql` | 2 | `fn_post_goods_receipt`, `fn_reverse_goods_receipt`, `fn_adjust_stock`, `v_stock_on_hand`, `v_lot_balance_check` |
| `0003_production.sql` | 3 | `fn_complete_batch`, `fn_reverse_batch` |
| `0004_orders_trace.sql` | 4 | `fn_dispatch_order`, `fn_reverse_dispatch`, `fn_trace_backward`, `fn_trace_forward`, `fn_mass_balance` |
| `0005_xero.sql` | 5 | `xero_connections`, `xero_mappings`, `xero_sync_jobs` + RLS |

> **File names:** Supabase records migrations by timestamp, so files are saved as `<version>_<name>.sql` (for example `20261022052219_init.sql` = 0001, `20261022052438_security_hardening.sql` = 0001b). The 0001–0005 labels above are the logical order.

### 7.4 Core schema (`0001_init.sql` tables)

```sql
-- ---------- Enums ----------
create type member_role       as enum ('owner','admin','manager','operator','viewer');
create type base_unit         as enum ('g','ml','each');
create type item_type         as enum ('raw_material','packaging','intermediate','finished_good');
create type date_mark         as enum ('use_by','best_before');
create type location_type     as enum ('ambient','chilled','frozen','quarantine','production');
create type lot_source        as enum ('goods_in','production','opening_balance');
create type lot_status        as enum ('available','quarantine','on_hold','recalled','written_off');
create type movement_type     as enum ('goods_in','production_consume','production_output',
                                       'dispatch','adjustment','reversal','opening_balance');
create type adjustment_reason as enum ('stock_count','waste','damage','expired','sample','correction','other');
create type receipt_status    as enum ('draft','posted','reversed');
create type recipe_status     as enum ('draft','active','archived');
create type batch_status      as enum ('planned','in_progress','completed','cancelled','reversed');
create type order_status      as enum ('draft','confirmed','dispatched','cancelled','reversed');

-- ---------- Tenancy ----------
create table organisations (
  id               uuid primary key default gen_random_uuid(),
  name             text not null check (length(btrim(name)) between 1 and 200),
  slug             text not null unique check (slug ~ '^[a-z0-9-]{3,50}$'),
  country          char(2) not null default 'GB' check (country in ('GB','US')),
  currency         char(3) not null default 'GBP' check (currency in ('GBP','USD')),
  timezone         text not null default 'Europe/London',
  default_vat_rate numeric(5,2) not null default 0 check (default_vat_rate between 0 and 100),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  created_at timestamptz not null default now()
);

create table org_members (
  org_id     uuid not null references organisations(id),
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       member_role not null default 'operator',
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index org_members_user_idx on org_members(user_id);

-- Human-readable code counters (GRN-000001, B-261019-01 ...). Formatting lives in lib/codes.ts.
create table code_sequences (
  org_id     uuid not null references organisations(id),
  kind       text not null,                  -- 'grn','goods_in_lot','batch','order'
  period     text not null default '',       -- '' = never resets, 'YYMMDD' = resets daily
  last_value integer not null default 0,
  primary key (org_id, kind, period)
);

-- ---------- Master data ----------
create table locations (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organisations(id),
  name       text not null,
  type       location_type not null default 'ambient',
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, id),
  unique (org_id, name)
);

create table suppliers (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references organisations(id),
  name         text not null,
  contact_name text,
  email        text,
  phone        text,
  address      jsonb,
  is_approved  boolean not null default true,
  is_active    boolean not null default true,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (org_id, id),
  unique (org_id, name)
);

create table customers (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references organisations(id),
  name               text not null,
  contact_name       text,
  email              text,
  phone              text,
  billing_address    jsonb,
  delivery_address   jsonb,
  vat_number         text,
  payment_terms_days integer not null default 30 check (payment_terms_days between 0 and 180),
  xero_contact_id    text,
  is_active          boolean not null default true,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (org_id, id),
  unique (org_id, name)
);

create table items (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references organisations(id),
  sku                 text not null,
  name                text not null,
  type                item_type not null,
  base_unit           base_unit not null,
  date_mark           date_mark,                         -- null = no expiry tracking
  shelf_life_days     integer check (shelf_life_days > 0),
  default_location_id uuid,
  reorder_point       numeric(18,3) check (reorder_point >= 0),   -- base units
  last_cost           numeric(20,8) check (last_cost >= 0),       -- per base unit
  sale_price          numeric(20,8) check (sale_price >= 0),      -- per base unit, ex VAT
  vat_rate            numeric(5,2) not null default 0 check (vat_rate between 0 and 100),
  xero_item_code      text,
  is_active           boolean not null default true,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (org_id, id),
  unique (org_id, sku),
  foreign key (org_id, default_location_id) references locations(org_id, id)
);

create table item_uoms (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references organisations(id),
  item_id             uuid not null,
  name                text not null,                        -- '16 kg sack', 'tray of 30'
  factor_to_base      numeric(18,6) not null check (factor_to_base > 0),
  is_default_purchase boolean not null default false,
  is_default_sales    boolean not null default false,
  created_at          timestamptz not null default now(),
  unique (org_id, id),
  unique (org_id, item_id, name),
  foreign key (org_id, item_id) references items(org_id, id)
);

-- ---------- Recipes ----------
create table recipes (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references organisations(id),
  output_item_id uuid not null,
  version        integer not null check (version > 0),
  status         recipe_status not null default 'draft',
  yield_qty      numeric(18,3) not null check (yield_qty > 0),          -- base units of output per batch
  labour_cost    numeric(14,2) not null default 0 check (labour_cost >= 0),   -- per batch
  overhead_cost  numeric(14,2) not null default 0 check (overhead_cost >= 0), -- per batch
  instructions   text,
  created_by     uuid references auth.users(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (org_id, id),
  unique (org_id, output_item_id, version),
  foreign key (org_id, output_item_id) references items(org_id, id)
);
create unique index recipes_one_active_idx on recipes(org_id, output_item_id) where status = 'active';

create table recipe_lines (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organisations(id),
  recipe_id  uuid not null,
  item_id    uuid not null,
  qty        numeric(18,3) not null check (qty > 0),                  -- base units per batch
  waste_pct  numeric(6,3) not null default 0 check (waste_pct >= 0 and waste_pct < 100),
  sort_order integer not null default 0,
  unique (org_id, id),
  foreign key (org_id, recipe_id) references recipes(org_id, id) on delete cascade,
  foreign key (org_id, item_id)   references items(org_id, id)
);

-- ---------- Goods In ----------
create table goods_receipts (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references organisations(id),
  code         text not null,                                 -- GRN-000001
  supplier_id  uuid not null,
  received_on  date not null default current_date,
  delivery_ref text,                                          -- supplier delivery note no.
  status       receipt_status not null default 'draft',
  notes        text,
  posted_at    timestamptz,
  posted_by    uuid references auth.users(id),
  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (org_id, id),
  unique (org_id, code),
  foreign key (org_id, supplier_id) references suppliers(org_id, id)
);

create table goods_receipt_lines (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references organisations(id),
  receipt_id        uuid not null,
  item_id           uuid not null,
  uom_name          text not null,                 -- snapshot of the unit the user entered
  uom_factor        numeric(18,6) not null check (uom_factor > 0),
  uom_qty           numeric(18,3) not null check (uom_qty > 0),
  qty               numeric(18,3) not null check (qty > 0),        -- base units = uom_qty * uom_factor
  unit_cost         numeric(20,8) not null check (unit_cost >= 0), -- per base unit
  supplier_lot_code text,
  expiry_date       date,
  location_id       uuid,
  temperature_c     numeric(4,1),
  condition_ok      boolean not null default true,
  sort_order        integer not null default 0,
  unique (org_id, id),
  foreign key (org_id, receipt_id)  references goods_receipts(org_id, id) on delete cascade,
  foreign key (org_id, item_id)     references items(org_id, id),
  foreign key (org_id, location_id) references locations(org_id, id)
);

-- ---------- Production ----------
create table production_batches (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references organisations(id),
  code            text not null,                              -- B-261019-01
  recipe_id       uuid not null,
  output_item_id  uuid not null,
  planned_qty     numeric(18,3) not null check (planned_qty > 0),   -- base units
  actual_qty      numeric(18,3) check (actual_qty > 0),
  status          batch_status not null default 'planned',
  planned_on      date not null default current_date,
  started_at      timestamptz,
  completed_at    timestamptz,
  expiry_date     date,
  materials_cost  numeric(14,4),
  labour_cost     numeric(14,2),
  overhead_cost   numeric(14,2),
  total_cost      numeric(14,4),
  unit_cost       numeric(20,8),                              -- per base unit of output
  notes           text,
  created_by      uuid references auth.users(id),
  completed_by    uuid references auth.users(id),
  reversed_at     timestamptz,
  reversed_by     uuid references auth.users(id),
  reversal_reason text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (org_id, id),
  unique (org_id, code),
  foreign key (org_id, recipe_id)      references recipes(org_id, id),
  foreign key (org_id, output_item_id) references items(org_id, id)
);

-- ---------- Lots ----------
create table lots (
  id                    uuid primary key default gen_random_uuid(),
  org_id                uuid not null references organisations(id),
  item_id               uuid not null,
  lot_code              text not null,                       -- GI-261019-001 or batch code
  source                lot_source not null,
  supplier_id           uuid,
  supplier_lot_code     text,
  goods_receipt_line_id uuid,
  production_batch_id   uuid,
  location_id           uuid,
  received_on           date not null default current_date,  -- or produced on
  expiry_date           date,
  qty_received          numeric(18,3) not null default 0 check (qty_received >= 0),
  qty_on_hand           numeric(18,3) not null default 0 check (qty_on_hand >= 0),
  unit_cost             numeric(20,8) not null default 0 check (unit_cost >= 0),
  status                lot_status not null default 'available',
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (org_id, id),
  unique (org_id, lot_code),
  foreign key (org_id, item_id)               references items(org_id, id),
  foreign key (org_id, supplier_id)           references suppliers(org_id, id),
  foreign key (org_id, goods_receipt_line_id) references goods_receipt_lines(org_id, id),
  foreign key (org_id, production_batch_id)   references production_batches(org_id, id),
  foreign key (org_id, location_id)           references locations(org_id, id)
);
create index lots_item_fefo_idx on lots(org_id, item_id, expiry_date nulls last, received_on)
  where qty_on_hand > 0;
create index lots_supplier_lot_idx on lots(org_id, supplier_lot_code);
create index lots_batch_idx on lots(org_id, production_batch_id);

create table batch_inputs (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organisations(id),
  batch_id    uuid not null,
  item_id     uuid not null,
  lot_id      uuid,                                         -- null while planned
  planned_qty numeric(18,3) check (planned_qty >= 0),
  actual_qty  numeric(18,3) check (actual_qty >= 0),
  unit_cost   numeric(20,8),                                -- copied from lot at completion
  unique (org_id, id),
  foreign key (org_id, batch_id) references production_batches(org_id, id),
  foreign key (org_id, item_id)  references items(org_id, id),
  foreign key (org_id, lot_id)   references lots(org_id, id)
);
create index batch_inputs_lot_idx on batch_inputs(org_id, lot_id);
create index batch_inputs_batch_idx on batch_inputs(org_id, batch_id);

-- ---------- Ledger ----------
create table stock_movements (
  id                   uuid primary key default gen_random_uuid(),
  org_id               uuid not null references organisations(id),
  lot_id               uuid not null,
  item_id              uuid not null,
  movement_type        movement_type not null,
  qty_delta            numeric(18,3) not null check (qty_delta <> 0),   -- signed, base units
  unit_cost            numeric(20,8) not null check (unit_cost >= 0),
  reason               adjustment_reason,
  note                 text,
  ref_type             text,          -- 'goods_receipt_line','batch_input','production_batch','order_allocation'
  ref_id               uuid,
  reverses_movement_id uuid references stock_movements(id),
  created_by           uuid references auth.users(id),
  created_at           timestamptz not null default now(),
  foreign key (org_id, lot_id)  references lots(org_id, id),
  foreign key (org_id, item_id) references items(org_id, id),
  check (movement_type <> 'adjustment' or reason is not null)
);
create index stock_movements_lot_idx  on stock_movements(org_id, lot_id, created_at);
create index stock_movements_item_idx on stock_movements(org_id, item_id, created_at);
create index stock_movements_ref_idx  on stock_movements(org_id, ref_type, ref_id);

-- ---------- Sales ----------
create table sales_orders (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references organisations(id),
  code                text not null,                          -- SO-000001
  customer_id         uuid not null,
  order_date          date not null default current_date,
  delivery_date       date,
  customer_ref        text,                                   -- customer PO number
  status              order_status not null default 'draft',
  currency            char(3) not null default 'GBP',
  subtotal            numeric(14,2) not null default 0,
  vat_total           numeric(14,2) not null default 0,
  total               numeric(14,2) not null default 0,
  notes               text,
  confirmed_at        timestamptz,
  dispatched_at       timestamptz,
  dispatched_by       uuid references auth.users(id),
  xero_invoice_id     text,
  xero_invoice_number text,
  xero_status         text,                                   -- DRAFT / AUTHORISED / PAID / VOIDED
  xero_synced_at      timestamptz,
  created_by          uuid references auth.users(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (org_id, id),
  unique (org_id, code),
  foreign key (org_id, customer_id) references customers(org_id, id)
);

create table sales_order_lines (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations(id),
  order_id      uuid not null,
  item_id       uuid not null,
  description   text,
  uom_name      text not null,
  uom_factor    numeric(18,6) not null check (uom_factor > 0),
  uom_qty       numeric(18,3) not null check (uom_qty > 0),
  qty           numeric(18,3) not null check (qty > 0),             -- base units
  unit_price    numeric(14,4) not null check (unit_price >= 0),     -- per uom, ex VAT
  vat_rate      numeric(5,2) not null default 0 check (vat_rate between 0 and 100),
  line_subtotal numeric(14,2) not null,
  line_vat      numeric(14,2) not null,
  sort_order    integer not null default 0,
  unique (org_id, id),
  foreign key (org_id, order_id) references sales_orders(org_id, id) on delete cascade,
  foreign key (org_id, item_id)  references items(org_id, id)
);

create table order_allocations (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations(id),
  order_line_id uuid not null,
  lot_id        uuid not null,
  qty           numeric(18,3) not null check (qty > 0),             -- base units
  created_at    timestamptz not null default now(),
  unique (org_id, id),
  foreign key (org_id, order_line_id) references sales_order_lines(org_id, id),
  foreign key (org_id, lot_id)        references lots(org_id, id)
);
create index order_allocations_lot_idx on order_allocations(org_id, lot_id);

-- ---------- Audit ----------
create table audit_log (
  id          bigint generated always as identity primary key,
  org_id      uuid not null references organisations(id),
  actor_id    uuid,
  entity_type text not null,
  entity_id   uuid not null,
  action      text not null check (action in ('insert','update','delete')),
  old_data    jsonb,
  new_data    jsonb,
  created_at  timestamptz not null default now()
);
create index audit_log_entity_idx on audit_log(org_id, entity_type, entity_id, created_at);
```

### 7.5 Triggers and helpers (also in `0001_init.sql`)

| Object | What it does |
|---|---|
| `fn_set_updated_at()` | `BEFORE UPDATE` on every table with `updated_at` |
| `fn_guard_lot_stock()` | `BEFORE INSERT OR UPDATE` on `lots`. Without `foodops.stock_write = 'on'`, rejects inserts with non-zero `qty_on_hand`/`qty_received`/`unit_cost` and any update that changes them. |
| `fn_guard_movements()` | On `stock_movements`: `INSERT` only when `foodops.stock_write = 'on'`; `UPDATE`/`DELETE` always rejected |
| `fn_guard_locked_docs()` | Blocks `DELETE` of posted/reversed receipts, completed/reversed batches and dispatched/reversed orders. Also blocks status changes into or out of `posted`, `completed`, `dispatched`, `reversed` unless `foodops.stock_write = 'on'`. |
| `fn_guard_locked_lines()` | Blocks changes to lines/inputs/allocations whose parent document is locked |
| `fn_audit()` | `AFTER INSERT/UPDATE/DELETE` on `lots`, `goods_receipts`, `production_batches`, `sales_orders`, `sales_order_lines`. Writes `audit_log` with the actor from `foodops.user_id` (fallback `auth.uid()`). |
| `fn_next_code(org, kind, period)` | Atomic counter via `INSERT … ON CONFLICT DO UPDATE … RETURNING` |
| `app_private.is_org_member(org)` | `SECURITY DEFINER` helper used by RLS policies; lives in the non-exposed `app_private` schema so it is not callable over the REST API |

**Function hardening:** every function sets `search_path = public` (Supabase advisor lint 0011).

**RLS pattern:** `enable row level security` on every table, plus a single policy `for select to authenticated using (is_org_member(org_id))`. `organisations` uses `is_org_member(id)` and `profiles` uses `id = auth.uid()`. There are no insert/update/delete policies, so browser clients cannot write. Stock functions are `revoke execute … from public, anon, authenticated`.

---

## 8. Business logic

All rules below live in pure TypeScript modules under `lib/` (unit tested with Vitest) or in Postgres functions (tested against local Supabase). Server Actions only validate input (Zod), call `getOrgContext()` and `requireRole()`, and then call these.

### 8.1 Units (`lib/units.ts`)

- Base units: `g`, `ml`, `each`. An item has exactly one base unit for its whole life (changing it requires a new item).
- Built-in conversions:
  - `kg` = 1000 g
  - `g` = 1 g
  - `l` = 1000 ml
  - `ml` = 1 ml
  - `each` = 1 each
  - US later: `lb` = 453.59237 g, `oz` = 28.349523125 g
- Item pack units from `item_uoms` (e.g. "16 kg sack" = 16000 g, "tray of 30" = 30 each).
- `toBase(qty, unit, item)` and `fromBase(qtyBase, unit, item)` use `decimal.js`. Results round to 3 decimals, half-up.
- Cross-dimension conversion (g ↔ ml) is **not allowed**. Liquids are bought and used in ml. If a client weighs liquids, set that item's base unit to g.
- `formatQty(qtyBase, item, preferredUnit?)` follows the display rules in 5.7.
- Water and other free/untracked inputs are not items. Recipe yield already includes their weight.

### 8.2 Codes (`lib/codes.ts`)

| Kind | Format | Counter period | Example |
|---|---|---|---|
| Goods receipt | `GRN-{6 digits}` | never resets | `GRN-000045` |
| Goods-in lot | `GI-{YYMMDD}-{3 digits}` | per day | `GI-261019-003` |
| Production batch (= output lot code) | `B-{YYMMDD}-{2 digits}` | per day | `B-261019-01` |
| Sales order | `SO-{6 digits}` | never resets | `SO-000123` |

- Dates use the org timezone.
- Codes are unique per org (DB constraint).
- The output lot of a batch uses the batch code, which is what is printed on the product, so a recall starts from what the customer can read on the pack.
- Supplier lot codes are stored as given and are searchable.

### 8.3 Goods In (`fn_post_goods_receipt`, week 2)

1. Validate:
   - the receipt is `draft`, has ≥1 line, and the supplier is active and approved
   - each line has qty > 0 and unit cost ≥ 0
   - expiry is required when the item has a `date_mark`
2. Lines with `condition_ok = false` create the lot as `quarantine`, otherwise `available`. Temperature is stored for the record; validation rules come with HACCP on the roadmap.
3. For each line:
   - Create a lot with `source = 'goods_in'`, `lot_code` from `fn_next_code`, and `qty_received = qty_on_hand = qty`.
   - Copy the cost, supplier lot code, expiry and location onto the lot.
   - Insert a `goods_in` movement.
   - Update `items.last_cost`.
4. Set the receipt to `posted` with `posted_at`/`posted_by`. Everything happens in one transaction.
5. Reversal (`fn_reverse_goods_receipt`):
   - Allowed only if every lot from the receipt is untouched (`qty_on_hand = qty_received` and no other movements).
   - Creates `reversal` movements to zero and sets the receipt to `reversed`.

### 8.4 Inventory and FEFO (`lib/fefo.ts`)

- **Available stock** means lots with status `available` and `qty_on_hand > 0` that are not expired on the reference date.
- **Expired** means:
  - `use_by` items: expiry date < reference date. These are **blocked** from production and dispatch.
  - `best_before` items: past date gives a warning, and the user must tick "use anyway" with a note.
- **FEFO order:**
  1. `expiry_date` ascending (nulls last)
  2. then `received_on` ascending
  3. then `lot_code` ascending
- `suggestAllocation(lots, qtyNeeded)` takes lots in FEFO order until the quantity is covered. It returns allocations plus `shortfall` (> 0 if there is not enough stock). It never allocates from quarantine/on_hold/recalled/written_off lots.
- Users can override the suggestion. The override is stored as the allocation, and the UI shows "not FEFO" in warning colour.
- **Adjustments** (`fn_adjust_stock`):
  - manager+ only
  - signed qty, reason required, note required for `other`
  - cannot take a lot below 0
- **Stock valuation** = Σ(`qty_on_hand × unit_cost`) over lots with qty > 0.
- **Low stock**: the sum of available qty per item is ≤ `reorder_point`.
- **Integrity check** (nightly + tests): for every lot, `qty_on_hand = Σ movements.qty_delta`. Any difference is raised in the dashboard as a danger alert.

### 8.5 Recipes and costing (`lib/costing.ts`)

- One `active` version per output item. Editing an active recipe creates a new draft version, and activating it archives the old one.
- **Current cost of an input item** (per base unit):
  1. weighted average `unit_cost` of available lots with qty > 0
  2. else `items.last_cost`
  3. else, for intermediates, the rolled-up cost of its active recipe
  4. else "missing cost" (shown as a warning, counted as 0)
- **Standard recipe cost** (per batch):
  - `materials = Σ line.qty × (1 + waste_pct/100) × currentCost(line.item)`
  - `total = materials + labour_cost + overhead_cost`
  - `unit_cost = total / yield_qty`
- **Margin** (finished goods with a sale price):
  - `margin = (sale_price − unit_cost) / sale_price`
  - `markup = (sale_price − unit_cost) / unit_cost`
- **Sub-recipes:** costing recurses through intermediates. A cycle (A uses B uses A) is rejected when saving. Max depth is 5.
- All maths uses `decimal.js`. Round only for display (money 2 dp, unit cost 4 dp).

### 8.6 Production batches (`fn_complete_batch`, `fn_reverse_batch`, week 3)

1. **Plan:**
   - Choose an active recipe and a planned output qty.
   - Inputs are scaled: `planned input = line.qty × (1 + waste_pct/100) × planned_qty / yield_qty`.
   - The batch gets its code at creation.
2. **Start:** status → `in_progress` (optional; can go straight to complete).
3. **Complete** (one transaction):
   - Input: an actual list of `{item_id, lot_id, qty}`, plus actual output qty and output expiry.
   - Default expiry = completion date + `shelf_life_days`.
   - Lock the input lots `FOR UPDATE`. Check each lot belongs to the org, is available, is not expired (`use_by`), and has qty ≥ requested.
   - For each input, insert a `production_consume` movement (negative), decrement the lot, and store `batch_inputs.actual_qty` + `unit_cost`.
   - `materials_cost = Σ actual_qty × lot.unit_cost`
   - `total_cost = materials_cost + labour_cost + overhead_cost`. Labour and overhead are copied from the recipe and editable before completion.
   - `unit_cost = total_cost / actual_qty`
   - Create the output lot:
     - `source = 'production'`
     - `lot_code = batch.code`
     - qty = actual output
     - cost = batch unit cost
   - Insert a `production_output` movement for the output lot.
   - Status → `completed`, and set `completed_at`/`completed_by`.
   - **Yield variance** = `actual_qty / planned_qty − 1` (shown on the batch).
4. **Reverse** (manager+):
   - Allowed only if the output lot is untouched (`qty_on_hand = qty_received`, no dispatches or consumption). Otherwise the UI lists the downstream records that must be reversed first.
   - Inserts `reversal` movements:
     - output lot back to 0
     - each input lot gets its consumed qty back
   - The output lot becomes `written_off`. The batch becomes `reversed` with a reason. Nothing is deleted.
5. A planned batch can be `cancelled`. It has no stock effect.

### 8.7 Orders and dispatch (`fn_dispatch_order`, `fn_reverse_dispatch`, week 4)

1. **Draft:**
   - Lines default to the item's sales unit and sale price (converted from per-base price).
   - `line_subtotal = uom_qty × unit_price`, rounded to 2 dp per line
   - `line_vat = line_subtotal × vat_rate/100`, rounded to 2 dp per line
   - Order totals = sum of the lines
   - Price and VAT rate are editable per line.
2. **Confirm:** locks the prices. Stock is not reserved in MVP; the dashboard shows confirmed demand vs stock.
3. **Dispatch** (one transaction):
   - Allocations per line: FEFO suggestion, overridable.
   - The allocated qty for each line must equal the line qty. Partial dispatch is roadmap; split the order instead.
   - Lock the lots and check they are available and not past `use_by`.
   - Insert a `dispatch` movement (negative) per allocation and insert the `order_allocations` row.
   - Status → `dispatched` with `dispatched_at`/`dispatched_by`.
   - Emit the Inngest event `order/dispatched` (Xero push, section 9).
4. **Delivery note PDF:** order lines with the lot codes and expiry dates dispatched.
5. **Reverse dispatch** (manager+, for mistakes or returns):
   - Inserts `reversal` movements that return the qty to the same lots. A returned lot can be set to `quarantine` in the same step.
   - Status → `reversed`.
   - If a Xero invoice exists, show "Create a credit note in Xero". Automatic credit notes are roadmap.

### 8.8 Traceability and mock recall (week 4)

- **Backward trace** from a lot:
  - its source (goods receipt + supplier + supplier lot code, or production batch)
  - for a production lot, each input lot, recursively (intermediates have their own batches)
- **Forward trace** from a lot:
  - every batch that consumed it, recursively through the output lots
  - every order allocation of the lot or any downstream lot → order → customer
- Both are recursive CTEs (`fn_trace_backward`, `fn_trace_forward`), scoped to `org_id`, with depth ≤ 10 and cycle protection.
- **Mock recall report** (PDF, target under 1 minute end to end, query < 2 s):
  1. Header: org, recall lot, item, supplier + supplier lot code, report time, generated by.
  2. Affected lots: every downstream lot with item, qty produced, qty on hand, status.
  3. Customers: every customer who received an affected lot, with order code, dispatch date, qty and contact details (name, phone, email, delivery address).
  4. **Mass balance** for the recall lot:
     - received
     - consumed in production
     - dispatched directly
     - adjusted out (waste etc.)
     - on hand
     - **unaccounted = received − (consumed + dispatched + adjusted out + on hand)**, shown as qty and %
  5. Actions checklist: quarantine on-hand lots (one click sets all affected lots with stock to `on_hold`), contact customers, record outcome.
- Search accepts our lot code, supplier lot code or batch code.

### 8.9 Dashboard metrics

- Stock value (8.4)
- Lots expiring in the next 7 days, with count and value
- Items at or below the reorder point
- Batches planned and completed this week
- Confirmed orders not yet dispatched
- Xero sync failures in the last 7 days
- Ledger integrity status

---

## 9. Xero integration

### 9.1 Principles

- **OAuth 2.0 with granular scopes only.** Our Xero app is new (created after 2 March 2026), so the broad scopes such as `accounting.transactions` are not available to it.
- **Tokens encrypted at rest.**
- **Idempotency key on every push.**
- **Invoices pushed as DRAFT by default.** An org setting allows `AUTHORISED` later.
- **Push more, pull less.** We push contacts and invoices. We pull only what we need: settings at connect time and invoice status.
- **Respect rate limits and `Retry-After` on HTTP 429.**

### 9.2 Xero app and scopes

- Create one Xero app (Web app) owned by Donia. Redirect URI: `https://<app-domain>/api/xero/callback` (plus a localhost URI for dev).
- **MVP scopes** (verify names in the Xero developer portal before the first build):
  - `openid profile email offline_access`
  - `accounting.contacts`: create/update customer contacts
  - `accounting.invoices`: create invoices, read their status (granular replacement for invoices within `accounting.transactions`)
  - `accounting.settings.read`: chart of accounts, tax rates
- Later: `accounting.payments.read` (payment details) and `accounting.manualjournals` (stock valuation journals) when those features are added.
- **Tier:** the free Starter tier (about 5 connections) is enough for the first clients. *Check current Xero developer pricing and limits before signing the fifth client.*

### 9.3 Connection flow

1. Owner/Admin clicks **Connect Xero** → redirect to Xero consent with a `state` = signed `{orgId, nonce}` (stored server-side, 10-minute TTL).
2. Callback:
   - verify `state`
   - exchange the code for tokens
   - call `/connections` to get the `tenantId`
   - if several tenants are returned, ask the user to pick one
3. Store in `xero_connections`: `tenant_id`, `tenant_name`, encrypted `access_token` and `refresh_token`, `expires_at`, `scopes`, `connected_by`, `status = 'active'`.
4. Pull settings once:
   - accounts (for the sales account picker)
   - tax rates (for VAT mapping)
   - Store the picks in `xero_mappings`.
5. Disconnect: revoke the token, call `DELETE /connections/{id}`, set status `disconnected`, and keep the sync history.

### 9.4 Tokens

- Access tokens are short-lived (about 30 minutes). Refresh tokens rotate on every refresh (each refresh returns a new refresh token) and expire if unused for about 60 days. *Confirm current values in the Xero docs.*
- Encryption:
  - AES-256-GCM in `integrations/xero/crypto.ts`
  - key `XERO_TOKEN_ENC_KEY` (32 bytes, base64) in Vercel env
  - store `iv:tag:ciphertext`
  - never log tokens
- Refresh under a row lock (`SELECT … FOR UPDATE` on the connection) so two jobs never refresh at the same time and invalidate each other.
- If the refresh fails with `invalid_grant`: status `needs_reconnect`, email the owner, and show a banner in the app.

### 9.5 `0005_xero.sql` tables

```sql
create table xero_connections (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null unique references organisations(id),
  tenant_id         text not null,
  tenant_name       text,
  access_token_enc  text not null,
  refresh_token_enc text not null,
  expires_at        timestamptz not null,
  scopes            text not null,
  status            text not null default 'active'
                    check (status in ('active','needs_reconnect','disconnected')),
  connected_by      uuid references auth.users(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table xero_mappings (
  org_id    uuid not null references organisations(id),
  kind      text not null check (kind in ('sales_account','tax_type','tracking_category')),
  local_key text not null,        -- e.g. 'default', or a VAT rate like '0' / '20'
  xero_id   text not null,        -- account code, TaxType, tracking option id
  label     text,
  primary key (org_id, kind, local_key)
);

create table xero_sync_jobs (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references organisations(id),
  entity_type     text not null check (entity_type in ('contact','invoice')),
  entity_id       uuid not null,
  operation       text not null check (operation in ('create','update','status_pull')),
  idempotency_key text not null unique,
  status          text not null default 'queued'
                  check (status in ('queued','running','succeeded','failed')),
  attempts        integer not null default 0,
  xero_id         text,
  last_error      text,
  next_retry_at   timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index xero_sync_jobs_entity_idx on xero_sync_jobs(org_id, entity_type, entity_id);
```

RLS: as for every table. Token columns are never selected by any client query, and the server-side query for the settings page excludes them.

### 9.6 Mapping (`integrations/xero/mapping.ts`, unit tested)

**Customer → Contact**

| Xero field | Source |
|---|---|
| `Name` | `customers.name` |
| `EmailAddress` | `customers.email` |
| `Phones` | `customers.phone` |
| `Addresses` | billing (`POBOX`) + delivery (`STREET`) |
| `TaxNumber` | `vat_number` |

Store the returned `ContactID` in `customers.xero_contact_id`. If a contact with the same name already exists in Xero (validation error on create), look it up by name and link it instead of creating a duplicate.

**Dispatched order → Invoice**

| Xero field | Source |
|---|---|
| `Type` | `ACCREC` |
| `Status` | `DRAFT` (org setting) |
| `Contact.ContactID` | `customers.xero_contact_id` (create the contact first if missing) |
| `Date` | dispatch date (org timezone) |
| `DueDate` | dispatch date + `payment_terms_days` |
| `Reference` | `SO-000123` + ` / ` + `customer_ref` if present |
| `LineAmountTypes` | `Exclusive` |
| `CurrencyCode` | order currency |
| `LineItems[]` | `Description` = item name + uom + lot codes dispatched; `Quantity` = `uom_qty`; `UnitAmount` = `unit_price`; `AccountCode` = mapping `sales_account/default`; `TaxType` = mapping `tax_type/<vat_rate>`; `ItemCode` = `xero_item_code` if set |

- Let Xero number the invoice. Store `InvoiceID`, `InvoiceNumber` and `Status` on the order.
- The UK tax types are pulled from the client's Xero at connect time and mapped by the admin. Do not hard-code them.

### 9.7 Jobs (Inngest)

- `xero/push-invoice`:
  - Triggered by `order/dispatched`.
  - Steps: load the connection → ensure the contact → create the invoice → save the IDs.
  - Idempotency key `inv:{orderId}` sent as the `Idempotency-Key` header and stored unique in `xero_sync_jobs`.
  - Skip if the order already has `xero_invoice_id`.
- `xero/push-contact`: on customer create/update when connected (key `contact:{customerId}:{updated_at}`).
- `xero/pull-invoice-status`:
  - nightly, plus on demand from the order page
  - fetch the invoices we created (`IDs=` filter, batches of ≤ 50)
  - update `xero_status`
- **Rate limits:** per tenant, 60 calls/min, 5,000 calls/day and 5 concurrent calls; app-wide 10,000 calls/min.
  - Inngest concurrency key = `tenant_id`, limit 2.
  - On 429, read `Retry-After` and `step.sleep` for that long, then retry.
  - Other 5xx errors: exponential backoff, max 5 attempts.
  - 4xx validation errors: fail the job, store the message, show it in the sync log with a **Retry** button.
- **Sync log UI** (`/settings/xero`): connection status, mappings, a recent jobs table, and retry on failed jobs.

---

## 10. Security, multi-tenancy and audit

### 10.1 Org context

```ts
// lib/org-context.ts (shape)
export type OrgContext = { orgId: string; userId: string; role: MemberRole };

export async function getOrgContext(): Promise<OrgContext>;
// 1. Read the Supabase session (server client, cookies). No session → redirect('/login').
// 2. Read the active org id from the 'foodops_org' cookie (a UI preference only).
// 3. Look up org_members WHERE user_id = session.user.id AND org_id = cookie value.
//    Not found → fall back to the user's first membership; none → redirect('/onboarding').
// 4. Return { orgId, userId, role } from the DATABASE row, never from the client.

export function requireRole(ctx: OrgContext, allowed: MemberRole[]): void; // throws 403

export async function withOrgTx<T>(ctx: OrgContext, fn: (tx: Tx) => Promise<T>): Promise<T>;
// Opens a Drizzle transaction and runs
//   select set_config('foodops.user_id', ctx.userId, true),
//          set_config('foodops.org_id',  ctx.orgId,  true);
// so audit triggers know the actor. Every query inside filters by ctx.orgId.
```

**Rules**

- No Server Action or route handler accepts `org_id` from the browser. Every ID received from the browser (item, lot, order) is looked up `WHERE org_id = ctx.orgId`, and "not found" is treated as 404.
- Drizzle connects with the database role that bypasses RLS. That is why the in-code scoping above is mandatory, and why composite FKs exist as a database-level backstop.
- The browser Supabase client is used only for auth. Data reads go through Server Components; writes go through Server Actions.

### 10.2 Secrets and environment

| Variable | Where |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client + server |
| `SUPABASE_SECRET_KEY` | Server only (invites, admin) |
| `DATABASE_URL` (transaction pooler, 6543, `prepare: false`) | Server, app queries |
| `DIRECT_URL` (session/direct, 5432) | Migrations, scripts |
| `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, `XERO_REDIRECT_URI`, `XERO_TOKEN_ENC_KEY` | Server only |
| `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` | Server |
| `RESEND_API_KEY`, `SENTRY_DSN` | Server |

### 10.3 Data protection

- Data is stored in the London region. Each client signs a DPA (Donia = processor, client = controller).
- Personal data held: user accounts and customer contact details. Recipes and costs are commercially sensitive, so they are treated as confidential.
- Sentry scrubs request bodies and cookies.
- Backups: check the Supabase plan's backup/PITR options before go-live and document them in the client contract.

### 10.4 Audit

- `audit_log` stores before/after JSON for lots, goods receipts, batches and orders (+ lines), with the actor and time.
- Viewer: `/settings/audit`, filterable by entity and user. The audit log is append-only and is not editable or deletable from the app.

---

## 11. Folder structure and conventions

Everything lives in one folder, `FoodOps ERP/`, which is also the Git repository root. The spec (`food-drink-erp-guide.md`) and `project-context.md` sit at the root next to the app code (no `src/` directory).

```
FoodOps ERP/   (repo root)
├─ food-drink-erp-guide.md, project-context.md
├─ app/
│  ├─ (auth)/login/page.tsx, signup/page.tsx, invite/accept/page.tsx
│  ├─ (app)/layout.tsx                 # AppShell, loads OrgContext
│  ├─ (app)/dashboard/page.tsx
│  ├─ (app)/items/..., suppliers/..., customers/...
│  ├─ (app)/goods-in/..., inventory/page.tsx
│  ├─ (app)/recipes/..., production/...
│  ├─ (app)/orders/..., traceability/...
│  ├─ (app)/settings/{org,users,locations,xero,audit}/page.tsx
│  ├─ (app)/exports/page.tsx
│  ├─ onboarding/page.tsx
│  ├─ api/inngest/route.ts
│  ├─ api/xero/{connect,callback}/route.ts
│  └─ globals.css                      # design tokens (section 5)
├─ components/
│  ├─ ui/                              # shadcn/ui generated
│  └─ app/                             # AppShell, DataTable, QtyCell, StatusBadge, LotPicker ...
├─ db/
│  ├─ index.ts                         # postgres-js + drizzle (prepare: false)
│  └─ schema/                          # one file per area, mirrors SQL migrations
├─ lib/
│  ├─ org-context.ts, auth.ts
│  ├─ units.ts, codes.ts, fefo.ts, costing.ts, money.ts, dates.ts
│  └─ validation/                      # Zod schemas shared by forms + actions
├─ server/
│  ├─ actions/                         # 'use server' per module
│  └─ queries/                         # read queries per module (always org-scoped)
├─ integrations/xero/                  # oauth.ts, client.ts, crypto.ts, mapping.ts
├─ inngest/                            # client.ts, functions/*.ts
├─ pdf/                                # recall-report.tsx, delivery-note.tsx
├─ supabase/
│  ├─ config.toml
│  ├─ migrations/0001_init.sql ...
│  └─ seed.sql                         # optional; main seed is scripts/seed.ts
├─ scripts/seed.ts                     # Hillside Bakehouse demo data
├─ tests/
│  ├─ unit/                            # units, costing, fefo, codes, money, xero-mapping
│  ├─ db/                              # stock functions against local Supabase
│  └─ e2e/                             # Playwright main flow
├─ drizzle.config.ts, vitest.config.ts, playwright.config.ts
└─ .env.local (never committed)
```

**Conventions**

- **Naming:** files `kebab-case.ts`, components `PascalCase`, DB `snake_case`, SQL functions `fn_*`.
- **Server Actions** return `{ ok: true, data } | { ok: false, error, fieldErrors? }` and never throw raw errors to the client.
- **Language:** English for code, comments and commit messages.
- **Commits:** conventional commits (`feat:`, `fix:`, `chore:`, `test:`).
- **Dependencies:** none added without a one-line reason in the PR or chat.

---

## 12. Seed data and testing

### 12.1 Demo company: Hillside Bakehouse Ltd (fictional)

An artisan bakery in England with about 20 staff that sells wholesale to cafés, delis and farm shops. **Every company and person below is fictional.** Prices are illustrative, not market data.

**Locations:** Dry Store (ambient), Walk-in Chiller (chilled), Freezer (frozen), Quarantine (quarantine), Bakery Floor (production).

**Suppliers (fictional):** Northfield Mills Ltd (flour, sugar, salt), Greenacre Dairy Supplies (butter, milk, eggs, yeast), Cocoa & Co Wholesale (chocolate), Packwell Packaging (bags, boxes, labels).

**Customers (fictional):** The Corner Café, Larder & Co Deli, Riverside Farm Shop.

**Items**

| SKU | Name | Type | Base | Pack unit | Pack cost | Cost / base | Date mark, shelf life |
|---|---|---|---|---|---|---|---|
| FLR-001 | Strong white bread flour | raw | g | 16 kg sack | £14.40 | £0.0009 | best_before, 180 d |
| SUG-001 | Caster sugar | raw | g | 25 kg sack | £27.50 | £0.0011 | best_before, 365 d |
| SLT-001 | Sea salt | raw | g | 5 kg tub | £6.00 | £0.0012 | none |
| BUT-001 | Unsalted butter | raw | g | 10 kg case | £72.00 | £0.0072 | use_by, 30 d |
| MLK-001 | Whole milk | raw | ml | 4 l bottle | £1.80 | £0.00045 | use_by, 7 d |
| EGG-001 | Free-range eggs | raw | each | tray of 30 | £7.50 | £0.25 | best_before, 28 d |
| YST-001 | Fresh yeast | raw | g | 1 kg block | £3.20 | £0.0032 | use_by, 21 d |
| CHC-001 | Dark chocolate callets 70% | raw | g | 2.5 kg bag | £28.00 | £0.0112 | best_before, 365 d |
| PKG-001 | Kraft bread bag | packaging | each | pack of 1000 | £60.00 | £0.06 | none |
| PKG-002 | Brownie box (12) | packaging | each | pack of 100 | £35.00 | £0.35 | none |
| PKG-003 | Product label | packaging | each | roll of 1000 | £20.00 | £0.02 | none |
| INT-001 | Sourdough starter | intermediate | g | — | — | rolled up | use_by, 3 d |
| FG-001 | Sourdough loaf 800 g | finished | each | — | sale £3.20 | — | best_before, 4 d |
| FG-002 | Chocolate brownies, box of 12 | finished | each | — | sale £14.00 | — | best_before, 7 d |
| FG-003 | Butter croissant | finished | each | — | sale £0.95 | — | best_before, 2 d |

VAT rates in the seed are set to 0% for simplicity. Real VAT treatment varies by product, so confirm every item with the client's accountant.

**Recipes** (water is untracked and included in the yield)

| Recipe | Yield | Lines | Labour + overhead | Unit cost | Margin |
|---|---|---|---|---|---|
| INT-001 Sourdough starter | 2,000 g | flour 1,000 g | £0 | £0.00045 / g | — |
| FG-001 Sourdough loaf | 20 each | flour 9,000 g; starter 2,000 g; salt 200 g; bag 20; label 20 | £18 + £6 | £1.742 | 45.6% |
| FG-002 Brownies box | 4 each | butter 1,000 g; sugar 1,200 g; eggs 16; chocolate 1,000 g; flour 400 g; box 4; label 4 | £15 + £5 | £11.39 | 18.6% (demo talking point: underpriced) |
| FG-003 Croissant | 60 each | flour 3,000 g; butter 1,500 g; sugar 300 g; yeast 120 g; milk 1,200 ml; salt 60 g | £20 + £6 | £0.680 | 28.4% |

**History** (generated relative to "today" so expiry dates stay realistic):

- 6 goods receipts over the last 3 weeks
- starter batches daily
- 8 sourdough, 3 brownie and 5 croissant batches
- 10 orders, 8 of them dispatched
- one stock-count adjustment and one waste adjustment

**Recall scenario:** one flour lot (supplier lot `NM-88231`) feeds 2 starter batches, 3 sourdough batches and 1 croissant batch, and is dispatched to The Corner Café and Larder & Co Deli. The mass balance shows about 1.5% unaccounted, so there is something to explain in the demo.

**Users:** `owner@hillside.test` (owner), `production@hillside.test` (manager), `floor@hillside.test` (operator).

`npm run seed` resets and reseeds a separate demo org only. It never touches other orgs.

### 12.2 Tests

| Layer | Tool | Must cover |
|---|---|---|
| Units | Vitest | toBase/fromBase for kg/g/l/ml/each and pack units; rounding; cross-dimension rejected; formatQty scaling |
| Codes | Vitest | each format, zero padding, daily reset period, timezone at midnight |
| FEFO | Vitest | ordering, expired use_by excluded, best_before warning, status filtering, shortfall, overrides |
| Costing | Vitest | waste %, labour/overhead, sub-recipe roll-up, cycle detection, missing cost, margin/markup, decimal precision |
| Money | Vitest | line rounding, VAT per line, totals |
| Xero mapping | Vitest | contact + invoice payloads, reference format, tax mapping, missing mapping error |
| DB functions | Vitest + local Supabase | goods-in posting, guards reject direct qty edits, batch complete/reverse, dispatch/reverse, ledger = balance, cross-org IDs rejected |
| E2E | Playwright | main flow in 6.2 on a seeded org, at desktop and tablet viewport (1024×768) |

CI (GitHub Actions): `lint` → `typecheck` → `vitest` (unit) on every push. DB and E2E tests run on PRs to `main`.

---

## 13. 6-week MVP plan

At the end of each week, run that week's checklist. Report what passes and what is still missing, then add a row to the status log in `project-context.md`.

### Week 1: Foundation

**Build**

- Next.js app, Tailwind, shadcn/ui, design tokens (section 5), Inter, AppShell with nav
- Supabase project in London. Supabase CLI linked. `0001_init.sql` applied.
- Drizzle schema mirroring 0001; `db/index.ts`
- Auth: signup, login, logout, password reset, invite user (admin API)
- Onboarding: create org (+ owner membership, default locations)
- `getOrgContext()`, `requireRole()`, `withOrgTx()`; org switcher
- Items, suppliers, customers, locations CRUD with Zod validation; item pack units
- `lib/units.ts` + `lib/codes.ts` with tests
- CI (lint, typecheck, Vitest), Vercel preview deploy, Sentry

**Acceptance checklist**

- [ ] `npx supabase db push` applies 0001 cleanly to a fresh project
- [ ] RLS is enabled on every table; the anon key cannot read any table; an authenticated user reads only their own org's rows
- [ ] A direct `UPDATE lots SET qty_on_hand = …` fails; a direct `INSERT INTO stock_movements` fails
- [ ] Composite FKs reject linking an item from org A to a recipe in org B
- [ ] A new user can sign up, create an org and land on the dashboard; an invited user joins with the right role
- [ ] Two orgs created by two users cannot see each other's items (manual + test)
- [ ] Items CRUD shows units with every quantity; invalid input shows field errors from Zod
- [ ] Unit and code tests pass; CI green; preview deploy works

### Week 2: Goods In and Inventory

**Build**

- `0002_goods_in_stock.sql`
- Goods In tablet flow (draft → post), reversal
- Inventory tabs (by item, by lot, expiring), adjustments, stock valuation
- `lib/fefo.ts` + tests
- CSV export: items, lots, movements

**Acceptance checklist**

- [ ] Posting a receipt creates lots with codes, movements and the right cost per base unit
- [ ] Quarantine on condition fail
- [ ] Expiry is required for dated items
- [ ] Reversal works only on untouched lots
- [ ] Ledger = balance check passes
- [ ] FEFO tests pass
- [ ] Goods In is usable on a 1024×768 tablet with 48 px targets

### Week 3: Recipes, costing and production

**Build**

- Recipe editor with versions and `CostBreakdown`
- `lib/costing.ts` + tests
- `0003_production.sql`
- Batch plan → run (LotPicker with FEFO) → complete → reverse
- Yield variance

**Acceptance checklist**

- [ ] Recipe cost matches the hand calculation for the seed recipes
- [ ] Sub-recipe roll-up works and cycles are rejected
- [ ] Completing a batch consumes the exact lots, creates the output lot at actual cost and writes the audit log
- [ ] Expired use_by lots are blocked
- [ ] Reversal restores the inputs and is blocked if the output was used

### Week 4: Orders, dispatch, traceability and recall

**Build**

- Customers/orders UI
- `0004_orders_trace.sql`
- Dispatch with FEFO allocation
- Delivery note PDF
- Trace views
- Mock recall PDF with mass balance
- Bulk on-hold action

**Acceptance checklist**

- [ ] The dispatch allocation total equals the line qty
- [ ] Lots decrement correctly
- [ ] Reverse dispatch restores the stock
- [ ] Backward and forward traces are correct on the seed recall scenario
- [ ] The recall PDF generates in under 1 minute from the search box (query < 2 s on seed data)
- [ ] Mass balance numbers reconcile

### Week 5: Xero

**Build**

- Xero app setup
- OAuth connect/disconnect, encrypted tokens, refresh with lock
- Account/tax mappings
- `0005_xero.sql`
- Inngest jobs (push contact, push invoice, nightly status pull)
- Sync log with retry

**Acceptance checklist**

- [ ] Connecting to the Xero demo company works
- [ ] Dispatching an order creates exactly one DRAFT invoice even when the job is retried (idempotency)
- [ ] A 429 response waits for `Retry-After`
- [ ] Tokens are unreadable in the DB
- [ ] Mapping tests pass
- [ ] Disconnect revokes access

### Week 6: Dashboard, polish and launch

**Build**

- Dashboard KPIs and charts
- Remaining CSV exports
- Audit log viewer
- Empty states
- Accessibility pass
- `scripts/seed.ts` (Hillside Bakehouse)
- Playwright main flow
- Performance check
- Production deploy
- Pilot onboarding pack (data import templates for items, suppliers, customers, opening stock)

**Acceptance checklist**

- [ ] Playwright main flow green on desktop and tablet
- [ ] Dashboard numbers match the underlying queries
- [ ] Seed demo runs in under 2 minutes
- [ ] The 15-minute demo script (section 16.4) runs without errors
- [ ] The production deploy uses separate env and keys from the demo

---

## 14. Pricing and packaging

> **Starting proposal.** These figures are not market data. Validate them in the first 5–10 discovery calls and adjust.

### 14.1 Structure

- **Setup fee** (one-off) covers:
  - onboarding
  - data import (items, suppliers, customers, recipes, opening stock)
  - Xero connection and mappings
  - training (2 sessions)
  - the client's customisation (the 20–30%)
- **Monthly subscription** covers hosting, support, updates, backups and Xero sync.
- **Change requests** after go-live: fixed-price quotes per change.

### 14.2 Proposed tiers (UK, ex VAT)

| Tier | For | Setup | Monthly |
|---|---|---|---|
| **Pilot** (first 2–3 clients) | Early adopters who give feedback and a case study | £1,500 | £149 for the first 3 months, then the Standard price |
| **Standard** | 5–30 staff, 1 site, up to 10 users | £2,500–£4,000 | £249 |
| **Growth** | 30–100 staff, more users, more customisation | £4,000–£7,500 | £399 |

- **US:** price in USD later, after the QuickBooks integration exists.
- **Pilot terms:** 60 days, paid. Agree success criteria up front:
  - mock recall in under 1 minute
  - cost per product for the top 10 SKUs
  - stock accuracy on a count
  - invoices flowing to Xero

### 14.3 Value framing (use the client's own numbers, never invented stats)

- **Hours saved per traceability test/audit:** ask how long their last one took.
- **Margin found:** the brownie example (18.6% margin) shows how one underpriced product shows up once costs are real.
- **Waste avoided:** FEFO and expiry alerts. Ask what they write off per month today.
- **Admin time:** invoices created in Xero automatically after dispatch.

### 14.4 Positioning vs off-the-shelf tools

Off-the-shelf inventory/MRP products exist (for example Katana, MRPeasy, Craftybase, Unleashed, Cin7). Our angle:

- built around the client's actual process (the 20–30% customisation)
- UK food traceability and mock recall front and centre
- direct support from the developer

*Do not quote competitor prices or features without checking their current websites first.*

---

## 15. Roadmap (after MVP)

| Phase | Theme | Features |
|---|---|---|
| R1 | Quality | HACCP/CCP logs, goods-in checks with pass/fail rules, temperature logs, cleaning records, supplier approval documents, non-conformance log |
| R1 | Allergens | 14 UK allergens per item, roll-up through recipes, allergen matrix per product, "may contain" flags |
| R2 | Labels | Product/batch labels with lot code and date mark, PPDS (Natasha's Law) ingredient/allergen labels, GS1 barcodes, thermal printer support |
| R2 | Purchasing | Purchase orders, reorder suggestions from reorder points and demand, supplier price history |
| R2 | Orders+ | Partial dispatch, customer price lists, standing orders, delivery routes, automatic credit notes in Xero |
| R3 | Sales channels | Shopify and Faire order import, stock sync |
| R3 | US | QuickBooks Online integration, lb/oz display, FSMA 204 KDE/CTE records |
| R3 | Drinks | Alcohol duty records (UK HMRC; US TTB), ABV per batch, bonded stock |
| R4 | AI features | OCR of delivery notes at Goods In, demand forecasting, recipe cost what-if, plain-English traceability questions, anomaly alerts on mass balance and yield variance |
| Ongoing | Platform | Dark mode, offline Goods In (PWA), multi-site with lot splitting between locations, Xero App Store listing, webhooks |

---

## 16. Lead generation, demos and sales process

> Never invent facts about a real company. Mark unknowns clearly (e.g. "employee count unknown").

### 16.1 Ideal customer profile

- **Who:** independent UK food & drink manufacturers, 5–100 employees, selling wholesale. Bakeries, sauces & preserves, snacks & confectionery, coffee roasters, ready meals.
- **Buyer:** founder/MD. **Champions:** operations or production manager, office manager, external bookkeeper.
- **Good-fit signals:**
  - uses Xero
  - stockists listed on their website
  - SALSA/BRCGS certification or working towards it
  - hiring production/ops roles
  - winning food awards
  - new wholesale or retail listings
- **Poor fit:** pure retail/café with no manufacturing, large manufacturers already on an enterprise ERP, alcohol-only producers (until the R3 drinks phase).

### 16.2 Where to find leads

| Source | How |
|---|---|
| Companies House | Advanced search by SIC code + status active. Codes to try: 10710 (bread, fresh pastry, cakes), 10720 (rusks, biscuits, preserved pastry, cakes), 10821 (cocoa & chocolate confectionery), 10822 (sugar confectionery), 10840 (condiments & seasonings), 10390 (other fruit & veg processing, e.g. preserves), 10830 (tea & coffee), 10850 (prepared meals), 10890 (other food n.e.c.). Later: 11050 (beer), 11010 (spirits), 11070 (soft drinks). *Confirm code descriptions on the Companies House SIC list.* |
| Certification directories | SALSA approved supplier listings (public directory); BRCGS directory |
| Awards & shows | Great Taste award producers (Guild of Fine Food); exhibitor lists from speciality food trade shows |
| Prospecting tools | Apollo / Vibe Prospecting: industry food production, UK, 5–100 employees; titles Founder, Managing Director, Operations Manager, Production Manager |
| Partners | Bookkeepers/accountants who serve food producers on Xero; food technologists and SALSA consultants |
| Content | LinkedIn posts: "mock recall in under a minute" demo video, cost-per-product breakdowns using the fictional bakery |

For each lead, record: company, website, SIC, location, size (or "unknown"), Xero signal (or "unknown"), contact name/title, source, date found.

### 16.3 Outreach (short, specific, no invented facts)

**LinkedIn connection note (≤ 300 chars):**
> Hi {first name}, I build traceability and costing systems for small UK food producers that run alongside Xero. Saw {real, verifiable detail, e.g. your stockist list}. Would a 15-min look at a mock recall in under a minute be useful?

**Email (first touch):**
> Subject: Mock recall in under a minute at {Company}?
>
> Hi {first name},
>
> I help independent food producers like {Company} see the true cost of every product and trace any batch back to the supplier lot and forward to every customer, with the invoices flowing into Xero.
>
> If your last traceability test or retailer request took hours of spreadsheets, I can show you the same exercise done in under a minute on a demo bakery. 15 minutes, no prep needed.
>
> Worth a look next week?
>
> Donia

Follow-ups: day 3 (short nudge plus the demo video), day 8 (cost-per-product angle), day 15 (break-up message).

### 16.4 Demo script (15 minutes, Hillside Bakehouse seed)

1. **(1 min)** Their problem in their words (from discovery).
2. **(3 min)** Goods In on a tablet: receive flour with the supplier lot code and expiry → lot created.
3. **(3 min)** Recipe cost: sourdough at £1.74 vs £3.20 sale; brownies at 18.6% margin → "this is the conversation owners want to have".
4. **(3 min)** Production batch: FEFO lot suggestion → complete → output lot with actual cost.
5. **(3 min)** **Mock recall:** search `NM-88231` → affected batches, customers, mass balance → PDF in seconds.
6. **(1 min)** Dispatch → DRAFT invoice appears in Xero.
7. **(1 min)** Next step: paid pilot with their own 10 items and 2 recipes.

### 16.5 Discovery questions

- How do you track lots and expiry today? Who does it, and how long does it take each week?
- When did you last run a traceability or mock recall test? How long did it take?
- Do you know the cost and margin of your top 5 products? How confident are you?
- What do you write off each month (expired, damaged)?
- Which accounting software do you use, and who raises invoices?
- How many people would use the system, and on what devices?
- What would make a pilot a clear success for you in 60 days?

### 16.6 Pipeline stages

Lead → Contacted → Discovery call → Demo → Pilot proposal → Pilot running → Customer → Case study.

---

## 17. Reconstruction notes and open decisions

This guide was rebuilt on 2026-10-19. **Carried over unchanged** from `project-context.md`/project instructions:

- niche and market
- MVP in/out list
- stack
- theme colours and font
- Xero decisions (granular scopes, Starter tier, DRAFT invoices, push more/pull less)
- engineering rules
- the demo company name

**Re-derived; confirm or correct before relying on them:**

1. The table and column design in 7.4, including composite FKs, enum values and numeric precisions.
2. The migration split by week (7.3) and the decision that SQL migrations are owned by the Supabase CLI (Drizzle is used for queries only).
3. Code formats (8.2): `GRN-`, `GI-YYMMDD-NNN`, `B-YYMMDD-NN`, `SO-`.
4. The full colour token set beyond the three named colours (5.2), and the decision not to map terracotta to shadcn `--accent`.
5. Business rules:
   - use_by blocks and best_before warns
   - quarantine on failed condition check
   - batch reversal only when the output is untouched
   - no stock reservation on confirmed orders
   - no partial dispatch in MVP
6. Costing method: weighted average of on-hand lots, falling back to the last cost.
7. Roles and the permission matrix (6.3).
8. Seed data details: suppliers, customers, items, prices and recipes (12.1).
9. All pricing figures (14.2).
10. The week-by-week checklists (13).

**Open questions**

- Does the client need a stock reservation on confirmed orders in MVP?
- Should the invoice status default to DRAFT for every client, or be an onboarding choice? (Currently DRAFT, with a setting.)
- Is opening-balance stock import needed in Week 2? (It is currently planned for the Week 6 onboarding pack.)

### Sources checked for this version

- Xero granular scopes: https://devblog.xero.com/upcoming-changes-to-xero-accounting-api-scopes-705c5a9621a0 and https://apideck.com/blog/xero-scopes
- Xero API limits: https://developer.xero.com/faq/limits
- FDA Food Traceability Rule compliance date: https://www.fda.gov/food/food-safety-modernization-act-fsma/fsma-final-rule-requirements-additional-traceability-records-certain-foods
