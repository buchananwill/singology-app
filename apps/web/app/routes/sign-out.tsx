import { href, redirect } from "react-router";

import { createSupabaseServerClient } from "../auth/supabase.server";
import type { Route } from "./+types/sign-out";

// POST only, so a prefetch or a link can never sign anyone out. `local` ends this browser's
// session and leaves the user's other devices signed in.
export async function action({ request }: Route.ActionArgs) {
  const headers = new Headers();
  await createSupabaseServerClient(request, headers).auth.signOut({ scope: "local" });
  throw redirect(href("/"), { headers });
}
