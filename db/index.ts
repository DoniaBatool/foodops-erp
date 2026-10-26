import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { serverEnv } from "@/lib/env";

import * as schema from "./schema";

// Drizzle connects as the database owner role, so it BYPASSES RLS.
// Every query must be scoped by org_id from getOrgContext() (lib/org-context.ts).

function createDb() {
  // Supabase transaction pooler (port 6543) does not support prepared statements.
  const client = postgres(serverEnv().DATABASE_URL, { prepare: false, max: 5 });
  return drizzle(client, { schema, casing: "snake_case" });
}

export type Db = ReturnType<typeof createDb>;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

// Reuse one pool across hot reloads in development.
const globalForDb = globalThis as unknown as { foodopsDb?: Db };

export function getDb(): Db {
  if (!globalForDb.foodopsDb) {
    globalForDb.foodopsDb = createDb();
  }
  return globalForDb.foodopsDb;
}

export { schema };
