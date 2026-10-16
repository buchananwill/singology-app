import { defineConfig } from "drizzle-kit";

// Generate only: migrations are applied with the Supabase CLI, never `drizzle-kit push` or `migrate`.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "../../supabase/migrations",
  migrations: { prefix: "supabase" },
  entities: { roles: { provider: "supabase" } },
});
