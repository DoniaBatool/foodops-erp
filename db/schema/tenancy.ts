import { char, integer, numeric, pgSchema, pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";

import { createdAt, id, updatedAt } from "./_columns";
import { memberRole } from "./enums";

// Supabase-managed auth schema: only the columns we read.
const authSchema = pgSchema("auth");
export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
  email: text("email"),
});

export const organisations = pgTable("organisations", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  country: char("country", { length: 2 }).notNull().default("GB"),
  currency: char("currency", { length: 3 }).notNull().default("GBP"),
  timezone: text("timezone").notNull().default("Europe/London"),
  defaultVatRate: numeric("default_vat_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // = auth.users.id
  fullName: text("full_name"),
  createdAt: createdAt(),
});

export const orgMembers = pgTable(
  "org_members",
  {
    orgId: uuid("org_id").notNull(),
    userId: uuid("user_id").notNull(),
    role: memberRole("role").notNull().default("operator"),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.orgId, t.userId] })],
);

export const codeSequences = pgTable(
  "code_sequences",
  {
    orgId: uuid("org_id").notNull(),
    kind: text("kind").notNull(),
    period: text("period").notNull().default(""),
    lastValue: integer("last_value").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.orgId, t.kind, t.period] })],
);

export type Organisation = typeof organisations.$inferSelect;
export type OrgMember = typeof orgMembers.$inferSelect;
