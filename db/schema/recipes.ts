import { integer, numeric, pgTable, text, unique, uuid } from "drizzle-orm/pg-core";

import { createdAt, id, money, orgId, qty, updatedAt } from "./_columns";
import { recipeStatus } from "./enums";

export const recipes = pgTable(
  "recipes",
  {
    id: id(),
    orgId: orgId(),
    outputItemId: uuid("output_item_id").notNull(),
    version: integer("version").notNull(),
    status: recipeStatus("status").notNull().default("draft"),
    yieldQty: qty("yield_qty").notNull(),
    labourCost: money("labour_cost").notNull().default("0"),
    overheadCost: money("overhead_cost").notNull().default("0"),
    instructions: text("instructions"),
    createdBy: uuid("created_by"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [unique().on(t.orgId, t.id), unique().on(t.orgId, t.outputItemId, t.version)],
);

export const recipeLines = pgTable(
  "recipe_lines",
  {
    id: id(),
    orgId: orgId(),
    recipeId: uuid("recipe_id").notNull(),
    itemId: uuid("item_id").notNull(),
    qty: qty("qty").notNull(),
    wastePct: numeric("waste_pct", { precision: 6, scale: 3 }).notNull().default("0"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [unique().on(t.orgId, t.id)],
);

export type Recipe = typeof recipes.$inferSelect;
export type RecipeLine = typeof recipeLines.$inferSelect;
