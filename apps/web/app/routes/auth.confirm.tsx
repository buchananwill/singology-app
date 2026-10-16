import { href, redirect } from "react-router";

import { SIGN_IN_LINK_FAILED_HREF } from "../auth/signInLinkFailed";
import { createSupabaseServerClient } from "../auth/supabase.server";
import type { Route } from "./+types/auth.confirm";

// The magic-link landing. Roles are read from the database on the next request, under the new
// session's claims, so a confirmed link goes to /sign-in, which sends a signed-in user home.
export async function loader({ request }: Route.LoaderArgs) {
  const params = new URL(request.url).searchParams;
  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  if (tokenHash === null || type === null) {
    throw redirect(SIGN_IN_LINK_FAILED_HREF);
  }
  const headers = new Headers();
  const { error } = await createSupabaseServerClient(request, headers).auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });
  if (error !== null) {
    throw redirect(SIGN_IN_LINK_FAILED_HREF);
  }
  throw redirect(href("/sign-in"), { headers });
}
