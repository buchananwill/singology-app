// Diagnostic: does SUPABASE_DB_PASSWORD equal the password inside DATABASE_URL? Prints booleans only.
import { requireEnv } from "../src/seed/env";

const fromUrl = decodeURIComponent(new URL(requireEnv("DATABASE_URL")).password);
const fromKey = requireEnv("SUPABASE_DB_PASSWORD");
console.log(`equal: ${fromUrl === fromKey}`);
console.log(`equal after trim: ${fromUrl.trim() === fromKey.trim()}`);
console.log(`lengths equal: ${fromUrl.length === fromKey.length}`);
