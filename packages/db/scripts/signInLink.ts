// Prints a one-time sign-in URL for a seeded user, the alpha's sign-in path until S6 sends email.
//   pnpm --filter @singology/db sign-in-link <email> [--origin http://localhost:5173]
import { parseArgs } from "node:util";

import { magicLinkTokenFor } from "../src/authAdmin";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { origin: { type: "string", default: "http://localhost:5173" } },
});
const [email] = positionals;
if (email === undefined || positionals.length !== 1) {
  throw new Error("Usage: sign-in-link <email> [--origin <origin>]");
}

const url = new URL("/auth/confirm", values.origin);
url.searchParams.set("token_hash", await magicLinkTokenFor(email));
url.searchParams.set("type", "magiclink");
console.log(url.href);
