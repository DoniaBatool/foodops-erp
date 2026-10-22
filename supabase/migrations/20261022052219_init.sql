-- =====================================================================
-- FoodOps ERP: 0001_init.sql
-- Spec: food-drink-erp-guide.md, sections 7.1–7.5
--
-- Creates: enums, all core tables, indexes, updated_at triggers,
-- stock guards, locked-document guards, audit triggers, fn_next_code, RLS.
-- Stock-changing functions come in 0002–0004; Xero tables in 0005.
--
-- Conventions:
--   * every business table has org_id + composite FKs (org_id, parent_id)
--   * quantities: numeric(18,3) in base units (g, ml, each)
--   * unit costs: numeric(20,8) per base unit; money totals: numeric(14,2)
--   * stock only changes when a stock function sets foodops.stock_write = 'on'
-- =====================================================================

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

-- =====================================================================
-- Helpers
-- =====================================================================

-- True only inside a transaction where a stock function has run
--   select set_config('foodops.stock_write', 'on', true);
create or replace function fn_stock_write_enabled()
returns boolean
language sql
stable
as $$
  select coalesce(current_setting('foodops.stock_write', true), '') = 'on';
$$;

-- Actor for audit rows: set per transaction by withOrgTx() on the server,
-- falls back to the Supabase JWT user.
create or replace function fn_current_actor()
returns uuid
language sql
stable
as $$
  select coalesce(nullif(current_setting('foodops.user_id', true), '')::uuid, auth.uid());
$$;

-- =====================================================================
-- updated_at
-- =====================================================================

create or replace function fn_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'organisations','locations','suppliers','customers','items','recipes',
    'goods_receipts','production_batches','lots','sales_orders'
  ] loop
    execute format(
      'create trigger %I before update on %I for each row execute function fn_set_updated_at()',
      t || '_set_updated_at', t);
  end loop;
end;
$$;

-- =====================================================================
-- Stock guards: qty_on_hand / unit_cost / ledger only change via stock functions
-- =====================================================================

create or replace function fn_guard_lot_stock()
returns trigger
language plpgsql
as $$
begin
  if fn_stock_write_enabled() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.qty_on_hand <> 0 or new.qty_received <> 0 or new.unit_cost <> 0 then
      raise exception 'lots: quantities and cost can only be set by stock functions'
        using errcode = 'P0001';
    end if;
  elsif tg_op = 'UPDATE' then
    if new.qty_on_hand  is distinct from old.qty_on_hand
       or new.qty_received is distinct from old.qty_received
       or new.unit_cost    is distinct from old.unit_cost
       or new.item_id      is distinct from old.item_id
       or new.org_id       is distinct from old.org_id then
      raise exception 'lots: quantities, cost and item can only be changed by stock functions'
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

create trigger lots_guard_stock
  before insert or update on lots
  for each row execute function fn_guard_lot_stock();

-- Append-only tables written only by stock functions (stock_movements, order_allocations).
create or replace function fn_guard_ledger()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if not fn_stock_write_enabled() then
      raise exception '%: rows can only be inserted by stock functions', tg_table_name
        using errcode = 'P0001';
    end if;
    return new;
  end if;

  raise exception '%: rows are append-only (no update or delete)', tg_table_name
    using errcode = 'P0001';
end;
$$;

create trigger stock_movements_guard
  before insert or update or delete on stock_movements
  for each row execute function fn_guard_ledger();

create trigger order_allocations_guard
  before insert or update or delete on order_allocations
  for each row execute function fn_guard_ledger();

-- =====================================================================
-- Locked documents
--   TG_ARGV[0] = comma-separated locked statuses
--   TG_ARGV[1] = comma-separated columns that may still change once locked
-- Without foodops.stock_write:
--   * a locked document cannot be deleted
--   * a document cannot move into or out of a locked status
--   * a locked document can only change its whitelisted columns
-- =====================================================================

create or replace function fn_guard_locked_docs()
returns trigger
language plpgsql
as $$
declare
  locked     text[] := string_to_array(tg_argv[0], ',');
  editable   text[] := string_to_array(coalesce(tg_argv[1], ''), ',') || array['updated_at'];
  old_status text;
  new_status text;
begin
  if fn_stock_write_enabled() then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' then
    if old.status::text = any(locked) then
      raise exception '%: % documents cannot be deleted, reverse them instead', tg_table_name, old.status
        using errcode = 'P0001';
    end if;
    return old;
  end if;

  if tg_op = 'INSERT' then
    if new.status::text = any(locked) then
      raise exception '%: cannot create a document directly in status %', tg_table_name, new.status
        using errcode = 'P0001';
    end if;
    return new;
  end if;

  -- UPDATE
  old_status := old.status::text;
  new_status := new.status::text;

  if old_status is distinct from new_status
     and (old_status = any(locked) or new_status = any(locked)) then
    raise exception '%: status % -> % is only allowed through stock functions',
      tg_table_name, old_status, new_status
      using errcode = 'P0001';
  end if;

  if old_status = any(locked)
     and (to_jsonb(new) - editable) is distinct from (to_jsonb(old) - editable) then
    raise exception '%: % documents are locked; only % can change',
      tg_table_name, old_status, array_to_string(editable, ', ')
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger goods_receipts_guard_locked
  before insert or update or delete on goods_receipts
  for each row execute function fn_guard_locked_docs('posted,reversed', 'notes');

create trigger production_batches_guard_locked
  before insert or update or delete on production_batches
  for each row execute function fn_guard_locked_docs('completed,reversed', 'notes');

create trigger sales_orders_guard_locked
  before insert or update or delete on sales_orders
  for each row execute function fn_guard_locked_docs(
    'dispatched,reversed',
    'notes,xero_invoice_id,xero_invoice_number,xero_status,xero_synced_at');

-- =====================================================================
-- Locked lines: child rows cannot change once their parent is locked
--   TG_ARGV[0] = parent table, TG_ARGV[1] = FK column on the child,
--   TG_ARGV[2] = comma-separated parent statuses that lock the lines
-- =====================================================================

create or replace function fn_guard_locked_lines()
returns trigger
language plpgsql
as $$
declare
  parent_table text   := tg_argv[0];
  fk_column    text   := tg_argv[1];
  locked       text[] := string_to_array(tg_argv[2], ',');
  rec          jsonb;
  parent_status text;
begin
  if fn_stock_write_enabled() then
    return coalesce(new, old);
  end if;

  foreach rec in array (
    case tg_op
      when 'INSERT' then array[to_jsonb(new)]
      when 'DELETE' then array[to_jsonb(old)]
      else array[to_jsonb(old), to_jsonb(new)]
    end
  ) loop
    execute format('select status::text from %I where org_id = $1 and id = $2', parent_table)
      into parent_status
      using (rec->>'org_id')::uuid, (rec->>fk_column)::uuid;

    if parent_status = any(locked) then
      raise exception '%: lines of a % % cannot change', tg_table_name, parent_status, parent_table
        using errcode = 'P0001';
    end if;
  end loop;

  return coalesce(new, old);
end;
$$;

create trigger goods_receipt_lines_guard_locked
  before insert or update or delete on goods_receipt_lines
  for each row execute function fn_guard_locked_lines('goods_receipts', 'receipt_id', 'posted,reversed');

create trigger batch_inputs_guard_locked
  before insert or update or delete on batch_inputs
  for each row execute function fn_guard_locked_lines('production_batches', 'batch_id', 'completed,reversed,cancelled');

create trigger sales_order_lines_guard_locked
  before insert or update or delete on sales_order_lines
  for each row execute function fn_guard_locked_lines('sales_orders', 'order_id', 'confirmed,dispatched,cancelled,reversed');

-- Recipes: once a version is active or archived, its lines are frozen
-- (edit = create a new draft version, section 8.5).
create trigger recipe_lines_guard_locked
  before insert or update or delete on recipe_lines
  for each row execute function fn_guard_locked_lines('recipes', 'recipe_id', 'active,archived');

create or replace function fn_guard_recipe_version()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    if old.status <> 'draft' then
      raise exception 'recipes: only draft versions can be deleted' using errcode = 'P0001';
    end if;
    return old;
  end if;

  if old.status <> 'draft'
     and (new.output_item_id, new.version, new.yield_qty, new.labour_cost, new.overhead_cost)
         is distinct from
         (old.output_item_id, old.version, old.yield_qty, old.labour_cost, old.overhead_cost) then
    raise exception 'recipes: % versions are frozen, create a new draft version', old.status
      using errcode = 'P0001';
  end if;

  if old.status = 'archived' and new.status <> 'archived' then
    raise exception 'recipes: archived versions cannot be reactivated, copy them to a new draft'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger recipes_guard_version
  before update or delete on recipes
  for each row execute function fn_guard_recipe_version();

-- =====================================================================
-- Audit log (lots, goods receipts, batches, orders, order lines)
-- =====================================================================

create or replace function fn_audit()
returns trigger
language plpgsql
as $$
begin
  insert into audit_log (org_id, actor_id, entity_type, entity_id, action, old_data, new_data)
  values (
    coalesce(new.org_id, old.org_id),
    fn_current_actor(),
    tg_table_name,
    coalesce(new.id, old.id),
    lower(tg_op),
    case when tg_op <> 'INSERT' then to_jsonb(old) end,
    case when tg_op <> 'DELETE' then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['lots','goods_receipts','production_batches','sales_orders','sales_order_lines'] loop
    execute format(
      'create trigger %I after insert or update or delete on %I for each row execute function fn_audit()',
      t || '_audit', t);
  end loop;
end;
$$;

create or replace function fn_guard_audit_log()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_log is append-only' using errcode = 'P0001';
end;
$$;

create trigger audit_log_append_only
  before update or delete on audit_log
  for each row execute function fn_guard_audit_log();

-- =====================================================================
-- Code counters (formatting lives in lib/codes.ts)
-- =====================================================================

create or replace function fn_next_code(p_org uuid, p_kind text, p_period text default '')
returns integer
language plpgsql
as $$
declare
  v_next integer;
begin
  insert into code_sequences (org_id, kind, period, last_value)
  values (p_org, p_kind, coalesce(p_period, ''), 1)
  on conflict (org_id, kind, period)
  do update set last_value = code_sequences.last_value + 1
  returning last_value into v_next;

  return v_next;
end;
$$;

-- =====================================================================
-- Row Level Security (second layer; the app writes through the server only)
-- =====================================================================

create or replace function is_org_member(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.org_members
    where org_id = p_org and user_id = auth.uid()
  );
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'organisations','profiles','org_members','code_sequences',
    'locations','suppliers','customers','items','item_uoms',
    'recipes','recipe_lines','goods_receipts','goods_receipt_lines',
    'production_batches','lots','batch_inputs','stock_movements',
    'sales_orders','sales_order_lines','order_allocations','audit_log'
  ] loop
    execute format('alter table %I enable row level security', t);
  end loop;

  -- Read-only policy for members on every org-scoped table.
  -- code_sequences gets no policy: clients never need it.
  foreach t in array array[
    'org_members','locations','suppliers','customers','items','item_uoms',
    'recipes','recipe_lines','goods_receipts','goods_receipt_lines',
    'production_batches','lots','batch_inputs','stock_movements',
    'sales_orders','sales_order_lines','order_allocations','audit_log'
  ] loop
    execute format(
      'create policy %I on %I for select to authenticated using (is_org_member(org_id))',
      t || '_member_select', t);
  end loop;
end;
$$;

create policy organisations_member_select on organisations
  for select to authenticated using (is_org_member(id));

create policy profiles_self_select on profiles
  for select to authenticated using (id = auth.uid());

-- No insert/update/delete policies: browser clients cannot write.
-- Belt and braces: remove write grants from the API roles on these tables.
revoke insert, update, delete, truncate on all tables in schema public from anon, authenticated;
revoke select on all tables in schema public from anon;

-- Functions are not callable over the REST API.
revoke execute on function fn_next_code(uuid, text, text) from public, anon, authenticated;
revoke execute on function fn_stock_write_enabled() from public, anon, authenticated;
revoke execute on function fn_current_actor() from public, anon, authenticated;
