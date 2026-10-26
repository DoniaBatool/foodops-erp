// Postgres enums from supabase/migrations/20261022052219_init.sql (spec 7.4).
// The SQL migration is the source of truth; keep these lists in the same order.
import { pgEnum } from "drizzle-orm/pg-core";

export const memberRole = pgEnum("member_role", ["owner", "admin", "manager", "operator", "viewer"]);
export const baseUnit = pgEnum("base_unit", ["g", "ml", "each"]);
export const itemType = pgEnum("item_type", ["raw_material", "packaging", "intermediate", "finished_good"]);
export const dateMark = pgEnum("date_mark", ["use_by", "best_before"]);
export const locationType = pgEnum("location_type", ["ambient", "chilled", "frozen", "quarantine", "production"]);
export const lotSource = pgEnum("lot_source", ["goods_in", "production", "opening_balance"]);
export const lotStatus = pgEnum("lot_status", ["available", "quarantine", "on_hold", "recalled", "written_off"]);
export const movementType = pgEnum("movement_type", [
  "goods_in",
  "production_consume",
  "production_output",
  "dispatch",
  "adjustment",
  "reversal",
  "opening_balance",
]);
export const adjustmentReason = pgEnum("adjustment_reason", [
  "stock_count",
  "waste",
  "damage",
  "expired",
  "sample",
  "correction",
  "other",
]);
export const receiptStatus = pgEnum("receipt_status", ["draft", "posted", "reversed"]);
export const recipeStatus = pgEnum("recipe_status", ["draft", "active", "archived"]);
export const batchStatus = pgEnum("batch_status", ["planned", "in_progress", "completed", "cancelled", "reversed"]);
export const orderStatus = pgEnum("order_status", ["draft", "confirmed", "dispatched", "cancelled", "reversed"]);

export type MemberRole = (typeof memberRole.enumValues)[number];
export type BaseUnit = (typeof baseUnit.enumValues)[number];
export type ItemType = (typeof itemType.enumValues)[number];
export type LocationType = (typeof locationType.enumValues)[number];
