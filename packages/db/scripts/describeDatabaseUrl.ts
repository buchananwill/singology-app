// Prints the host, port and project ref of the loaded DATABASE_URL, never the password.
import { requireEnv } from "../src/seed/env";

const url = new URL(requireEnv("DATABASE_URL"));
console.log(`host=${url.hostname} port=${url.port} ref=${url.username.split(".")[1] ?? "(none)"}`);
console.log(`SUPABASE_DB_PASSWORD set: ${Boolean(process.env.SUPABASE_DB_PASSWORD)}`);
