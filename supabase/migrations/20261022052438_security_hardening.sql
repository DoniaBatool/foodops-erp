-- =====================================================================
-- FoodOps ERP: security hardening after 0001 (Supabase advisor findings)
-- 1. Pin search_path on every function (lint 0011).
-- 2. Move is_org_member() out of the API-exposed public schema (lints 0028/0029).
--    RLS policies reference the function by OID, so they keep working.
-- 3. Supabase's rls_auto_enable() event-trigger function must not be callable over REST.
-- =====================================================================

alter function public.fn_stock_write_enabled()   set search_path = public;
alter function public.fn_current_actor()         set search_path = public;
alter function public.fn_set_updated_at()        set search_path = public;
alter function public.fn_guard_lot_stock()       set search_path = public;
alter function public.fn_guard_ledger()          set search_path = public;
alter function public.fn_guard_locked_docs()     set search_path = public;
alter function public.fn_guard_locked_lines()    set search_path = public;
alter function public.fn_guard_recipe_version()  set search_path = public;
alter function public.fn_audit()                 set search_path = public;
alter function public.fn_guard_audit_log()       set search_path = public;
alter function public.fn_next_code(uuid, text, text) set search_path = public;

create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to authenticated;

alter function public.is_org_member(uuid) set schema app_private;
revoke execute on function app_private.is_org_member(uuid) from public, anon;
grant execute on function app_private.is_org_member(uuid) to authenticated;

do $$
begin
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  ) then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end;
$$;
