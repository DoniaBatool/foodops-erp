// Shared column helpers so every table uses the same types as the SQL migration.
// numeric columns are returned as strings by the driver: wrap them in decimal.js, never Number().
import { numeric, timestamp, uuid } from "drizzle-orm/pg-core";

export const id = () => uuid("id").primaryKey().defaultRandom();
export const orgId = () => uuid("org_id").notNull();

/** Quantity in base units (g, ml, each): numeric(18,3). */
export const qty = (name: string) => numeric(name, { precision: 18, scale: 3 });
/** Cost or price per base unit: numeric(20,8). */
export const unitCost = (name: string) => numeric(name, { precision: 20, scale: 8 });
/** Money total: numeric(14,2). */
export const money = (name: string) => numeric(name, { precision: 14, scale: 2 });

export const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
export const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();
