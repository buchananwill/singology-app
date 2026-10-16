// Prints DATABASE_URL with the password redacted, for diagnosing connection problems.
process.loadEnvFile(new URL("../.env", import.meta.url));

const raw = process.env.DATABASE_URL;
if (!raw) {
  throw new Error("DATABASE_URL is not set in packages/db/.env");
}
const url = new URL(raw);
url.password = url.password ? "REDACTED" : "";
console.log(url.toString());
console.log(`SUPABASE_DB_PASSWORD set: ${Boolean(process.env.SUPABASE_DB_PASSWORD)}`);
