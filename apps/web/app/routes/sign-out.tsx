import { href, redirect } from "react-router";

import { logAuthError } from "../auth/logAuthError";

import { supabaseContext } from "../context";
import type { Route } from "./+types/sign-out";

export async function action({ context }: Route.ActionArgs) {
  const { client, headers } = context.get(supabaseContext);
  // `local` ends this browser's session and leaves the user's other devices signed in.
  const { error } = await client.auth.signOut({ scope: "local" });
  if (error !== null) {
    logAuthError("signOut", error);
  }
  throw redirect(href("/"), { headers });
}
