import { char, date, integer, numeric, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { createdAt, id, money, orgId, qty, updatedAt } from "./_columns";
import { orderStatus } from "./enums";

export const salesOrders = pgTable(
  "sales_orders",
  {
    id: id(),
    orgId: orgId(),
    code: text("code").notNull(),
    customerId: uuid("customer_id").notNull(),
    orderDate: date("order_date").notNull().defaultNow(),
    deliveryDate: date("delivery_date"),
    customerRef: text("customer_ref"),
    status: orderStatus("status").notNull().default("draft"),
    currency: char("currency", { length: 3 }).notNull().default("GBP"),
    subtotal: money("subtotal").notNull().default("0"),
    vatTotal: money("vat_total").notNull().default("0"),
    total: money("total").notNull().default("0"),
    notes: text("notes"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    dispatchedAt: timestamp("dispatched_at", { withTimezone: true }),
    dispatchedBy: uuid("dispatched_by"),
    xeroInvoiceId: text("xero_invoice_id"),
    xeroInvoiceNumber: text("xero_invoice_number"),
    xeroStatus: text("xero_status"),
    xeroSyncedAt: timestamp("xero_synced_at", { withTimezone: true }),
    createdBy: uuid("created_by"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [unique().on(t.orgId, t.id), unique().on(t.orgId, t.code)],
);

export const salesOrderLines = pgTable(
  "sales_order_lines",
  {
    id: id(),
    orgId: orgId(),
    orderId: uuid("order_id").notNull(),
    itemId: uuid("item_id").notNull(),
    description: text("description"),
    uomName: text("uom_name").notNull(),
    uomFactor: numeric("uom_factor", { precision: 18, scale: 6 }).notNull(),
    uomQty: qty("uom_qty").notNull(),
    qty: qty("qty").notNull(),
    unitPrice: numeric("unit_price", { precision: 14, scale: 4 }).notNull(),
    vatRate: numeric("vat_rate", { precision: 5, scale: 2 }).notNull().default("0"),
    lineSubtotal: money("line_subtotal").notNull(),
    lineVat: money("line_vat").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [unique().on(t.orgId, t.id)],
);

export const orderAllocations = pgTable(
  "order_allocations",
  {
    id: id(),
    orgId: orgId(),
    orderLineId: uuid("order_line_id").notNull(),
    lotId: uuid("lot_id").notNull(),
    qty: qty("qty").notNull(),
    createdAt: createdAt(),
  },
  (t) => [unique().on(t.orgId, t.id)],
);

export type SalesOrder = typeof salesOrders.$inferSelect;
export type SalesOrderLine = typeof salesOrderLines.$inferSelect;
