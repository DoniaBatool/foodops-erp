// Stock tables. Rows that change quantities are written ONLY by Postgres stock functions
// (guard triggers reject anything else). Never update qty_on_hand / unit_cost from app code.
import { boolean, date, integer, numeric, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { createdAt, id, orgId, qty, unitCost, updatedAt } from "./_columns";
import { adjustmentReason, batchStatus, lotSource, lotStatus, movementType, receiptStatus } from "./enums";

export const goodsReceipts = pgTable(
  "goods_receipts",
  {
    id: id(),
    orgId: orgId(),
    code: text("code").notNull(),
    supplierId: uuid("supplier_id").notNull(),
    receivedOn: date("received_on").notNull().defaultNow(),
    deliveryRef: text("delivery_ref"),
    status: receiptStatus("status").notNull().default("draft"),
    notes: text("notes"),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    postedBy: uuid("posted_by"),
    createdBy: uuid("created_by"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [unique().on(t.orgId, t.id), unique().on(t.orgId, t.code)],
);

export const goodsReceiptLines = pgTable(
  "goods_receipt_lines",
  {
    id: id(),
    orgId: orgId(),
    receiptId: uuid("receipt_id").notNull(),
    itemId: uuid("item_id").notNull(),
    uomName: text("uom_name").notNull(),
    uomFactor: numeric("uom_factor", { precision: 18, scale: 6 }).notNull(),
    uomQty: qty("uom_qty").notNull(),
    qty: qty("qty").notNull(),
    unitCost: unitCost("unit_cost").notNull(),
    supplierLotCode: text("supplier_lot_code"),
    expiryDate: date("expiry_date"),
    locationId: uuid("location_id"),
    temperatureC: numeric("temperature_c", { precision: 4, scale: 1 }),
    conditionOk: boolean("condition_ok").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [unique().on(t.orgId, t.id)],
);

export const productionBatches = pgTable(
  "production_batches",
  {
    id: id(),
    orgId: orgId(),
    code: text("code").notNull(),
    recipeId: uuid("recipe_id").notNull(),
    outputItemId: uuid("output_item_id").notNull(),
    plannedQty: qty("planned_qty").notNull(),
    actualQty: qty("actual_qty"),
    status: batchStatus("status").notNull().default("planned"),
    plannedOn: date("planned_on").notNull().defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    expiryDate: date("expiry_date"),
    materialsCost: numeric("materials_cost", { precision: 14, scale: 4 }),
    labourCost: numeric("labour_cost", { precision: 14, scale: 2 }),
    overheadCost: numeric("overhead_cost", { precision: 14, scale: 2 }),
    totalCost: numeric("total_cost", { precision: 14, scale: 4 }),
    unitCost: unitCost("unit_cost"),
    notes: text("notes"),
    createdBy: uuid("created_by"),
    completedBy: uuid("completed_by"),
    reversedAt: timestamp("reversed_at", { withTimezone: true }),
    reversedBy: uuid("reversed_by"),
    reversalReason: text("reversal_reason"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [unique().on(t.orgId, t.id), unique().on(t.orgId, t.code)],
);

export const lots = pgTable(
  "lots",
  {
    id: id(),
    orgId: orgId(),
    itemId: uuid("item_id").notNull(),
    lotCode: text("lot_code").notNull(),
    source: lotSource("source").notNull(),
    supplierId: uuid("supplier_id"),
    supplierLotCode: text("supplier_lot_code"),
    goodsReceiptLineId: uuid("goods_receipt_line_id"),
    productionBatchId: uuid("production_batch_id"),
    locationId: uuid("location_id"),
    receivedOn: date("received_on").notNull().defaultNow(),
    expiryDate: date("expiry_date"),
    qtyReceived: qty("qty_received").notNull().default("0"),
    qtyOnHand: qty("qty_on_hand").notNull().default("0"),
    unitCost: unitCost("unit_cost").notNull().default("0"),
    status: lotStatus("status").notNull().default("available"),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [unique().on(t.orgId, t.id), unique().on(t.orgId, t.lotCode)],
);

export const batchInputs = pgTable(
  "batch_inputs",
  {
    id: id(),
    orgId: orgId(),
    batchId: uuid("batch_id").notNull(),
    itemId: uuid("item_id").notNull(),
    lotId: uuid("lot_id"),
    plannedQty: qty("planned_qty"),
    actualQty: qty("actual_qty"),
    unitCost: unitCost("unit_cost"),
  },
  (t) => [unique().on(t.orgId, t.id)],
);

export const stockMovements = pgTable("stock_movements", {
  id: id(),
  orgId: orgId(),
  lotId: uuid("lot_id").notNull(),
  itemId: uuid("item_id").notNull(),
  movementType: movementType("movement_type").notNull(),
  qtyDelta: qty("qty_delta").notNull(),
  unitCost: unitCost("unit_cost").notNull(),
  reason: adjustmentReason("reason"),
  note: text("note"),
  refType: text("ref_type"),
  refId: uuid("ref_id"),
  reversesMovementId: uuid("reverses_movement_id"),
  createdBy: uuid("created_by"),
  createdAt: createdAt(),
});

export type GoodsReceipt = typeof goodsReceipts.$inferSelect;
export type Lot = typeof lots.$inferSelect;
export type ProductionBatch = typeof productionBatches.$inferSelect;
export type StockMovement = typeof stockMovements.$inferSelect;
