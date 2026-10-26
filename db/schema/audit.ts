import { bigint, jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { createdAt, orgId } from "./_columns";

// Written only by the fn_audit() trigger; append-only.
export const auditLog = pgTable("audit_log", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  orgId: orgId(),
  actorId: uuid("actor_id"),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  action: text("action").notNull(),
  oldData: jsonb("old_data"),
  newData: jsonb("new_data"),
  createdAt: createdAt(),
});

export type AuditLogEntry = typeof auditLog.$inferSelect;
