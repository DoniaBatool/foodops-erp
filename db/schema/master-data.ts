import { boolean, integer, jsonb, numeric, pgTable, text, unique, uuid } from "drizzle-orm/pg-core";

import { createdAt, id, orgId, qty, unitCost, updatedAt } from "./_columns";
import { baseUnit, dateMark, itemType, locationType } from "./enums";

// Composite foreign keys (org_id, parent_id) are enforced in the SQL migration.

export const locations = pgTable(
  "locations",
  {
    id: id(),
    orgId: orgId(),
    name: text("name").notNull(),
    type: locationType("type").notNull().default("ambient"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [unique().on(t.orgId, t.id), unique().on(t.orgId, t.name)],
);

export const suppliers = pgTable(
  "suppliers",
  {
    id: id(),
    orgId: orgId(),
    name: text("name").notNull(),
    contactName: text("contact_name"),
    email: text("email"),
    phone: text("phone"),
    address: jsonb("address"),
    isApproved: boolean("is_approved").notNull().default(true),
    isActive: boolean("is_active").notNull().default(true),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [unique().on(t.orgId, t.id), unique().on(t.orgId, t.name)],
);

export const customers = pgTable(
  "customers",
  {
    id: id(),
    orgId: orgId(),
    name: text("name").notNull(),
    contactName: text("contact_name"),
    email: text("email"),
    phone: text("phone"),
    billingAddress: jsonb("billing_address"),
    deliveryAddress: jsonb("delivery_address"),
    vatNumber: text("vat_number"),
    paymentTermsDays: integer("payment_terms_days").notNull().default(30),
    xeroContactId: text("xero_contact_id"),
    isActive: boolean("is_active").notNull().default(true),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [unique().on(t.orgId, t.id), unique().on(t.orgId, t.name)],
);

export const items = pgTable(
  "items",
  {
    id: id(),
    orgId: orgId(),
    sku: text("sku").notNull(),
    name: text("name").notNull(),
    type: itemType("type").notNull(),
    baseUnit: baseUnit("base_unit").notNull(),
    dateMark: dateMark("date_mark"),
    shelfLifeDays: integer("shelf_life_days"),
    defaultLocationId: uuid("default_location_id"),
    reorderPoint: qty("reorder_point"),
    lastCost: unitCost("last_cost"),
    salePrice: unitCost("sale_price"),
    vatRate: numeric("vat_rate", { precision: 5, scale: 2 }).notNull().default("0"),
    xeroItemCode: text("xero_item_code"),
    isActive: boolean("is_active").notNull().default(true),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [unique().on(t.orgId, t.id), unique().on(t.orgId, t.sku)],
);

export const itemUoms = pgTable(
  "item_uoms",
  {
    id: id(),
    orgId: orgId(),
    itemId: uuid("item_id").notNull(),
    name: text("name").notNull(),
    factorToBase: numeric("factor_to_base", { precision: 18, scale: 6 }).notNull(),
    isDefaultPurchase: boolean("is_default_purchase").notNull().default(false),
    isDefaultSales: boolean("is_default_sales").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [unique().on(t.orgId, t.id), unique().on(t.orgId, t.itemId, t.name)],
);

export type Location = typeof locations.$inferSelect;
export type Supplier = typeof suppliers.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Item = typeof items.$inferSelect;
export type ItemUom = typeof itemUoms.$inferSelect;
