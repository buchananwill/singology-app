// Diagnostic: the key names packages/db/.env defines, and which keys the parent environment also
// had before loading. Prints names only.
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";

const keys = Object.keys(parseEnv(readFileSync(new URL("../.env", import.meta.url), "utf8")));
console.log(`file keys: ${keys.join(", ")}`);
console.log(
  `inherited: ${["DATABASE_URL", "SUPABASE_DB_PASSWORD"].filter((k) => process.env[k] !== undefined).join(", ")}`,
);
