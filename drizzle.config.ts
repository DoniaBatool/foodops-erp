import { defineConfig } from "drizzle-kit";

// Migrations are plain SQL in supabase/migrations, applied with the Supabase CLI (spec 4, 7.3).
// drizzle-kit is only used for `npx drizzle-kit studio` / `check`, never `generate` or `push`.
export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema/index.ts",
  casing: "snake_case",
  dbCredentials: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
