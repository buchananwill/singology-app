import { ConfirmLinkSchema } from "@singology/shared";
import { href, redirect } from "react-router";

import { logAuthError } from "../auth/logAuthError";
import { SIGN_IN_LINK_FAILED_HREF } from "../auth/signInLinkFailed";

import { supabaseContext } from "../context";
import type { Route } from "./+types/auth.confirm";

// Roles are read on the next request, under the new session's claims, so a confirmed link goes to
// /sign-in, whose loader sends a signed-in user home.
export async function loader({ context, request }: Route.LoaderArgs) {
  const parsed = ConfirmLinkSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) {
    throw redirect(SIGN_IN_LINK_FAILED_HREF);
  }
  const { client, headers } = context.get(supabaseContext);
  const { error } = await client.auth.verifyOtp(parsed.data);
  if (error !== null) {
    logAuthError("verifyOtp", error);
    throw redirect(SIGN_IN_LINK_FAILED_HREF);
  }
  throw redirect(href("/sign-in"), { headers });
}
