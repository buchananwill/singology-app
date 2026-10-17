import { href, redirect } from "react-router";

import { logAuthError } from "../auth/logAuthError";
import { createSupabaseServerClient } from "../auth/supabase.server";
import type { Route } from "./+types/sign-out";

export async function action({ request }: Route.ActionArgs) {
  const { client, headers } = createSupabaseServerClient(request);
  // `local` ends this browser's session and leaves the user's other devices signed in.
  const { error } = await client.auth.signOut({ scope: "local" });
  if (error !== null) {
    logAuthError("signOut", error);
  }
  throw redirect(href("/"), { headers });
}
