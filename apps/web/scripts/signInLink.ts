// Prints a one-time sign-in URL for a seeded user, the alpha's sign-in path until S6 sends email.
//   pnpm -s --filter @singology/web sign-in-link <email> [--origin http://localhost:5173]
import { parseArgs } from "node:util";

import { magicLinkTokenFor } from "@singology/db/admin";

import { confirmHref } from "../app/auth/confirmLink";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { origin: { type: "string", default: "http://localhost:5173" } },
});
const [email] = positionals;
if (email === undefined || positionals.length !== 1) {
  throw new Error("Usage: sign-in-link <email> [--origin <origin>]");
}

console.log(new URL(confirmHref(await magicLinkTokenFor(email)), values.origin).href);
