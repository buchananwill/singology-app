import { ConfirmLinkSchema } from "@singology/shared";
import { href, redirect } from "react-router";

import { logAuthError } from "../auth/logAuthError";
import { SIGN_IN_LINK_FAILED_HREF } from "../auth/signInLinkFailed";
import { requestTimeContext, supabaseContext } from "../context";
import { repositoriesFor } from "../middleware/repositories";
import type { Route } from "./+types/auth.confirm";

// Roles are read on the next request, under the new session's claims, so a confirmed link goes to
// /sign-in, whose loader sends a signed-in user home.
export async function loader({ context, request }: Route.LoaderArgs) {
  const parsed = ConfirmLinkSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) {
    throw redirect(SIGN_IN_LINK_FAILED_HREF);
  }
  const { client, headers } = context.get(supabaseContext);
  const { data, error } = await client.auth.verifyOtp(parsed.data);
  if (error !== null) {
    logAuthError("verifyOtp", error);
    throw redirect(SIGN_IN_LINK_FAILED_HREF);
  }
  if (data.user !== null) {
    // The request's repositories carry the claims from before the link was verified.
    const claims = { role: "authenticated", sub: data.user.id, email: data.user.email } as const;
    await repositoriesFor(claims, context.get(requestTimeContext))
      .events.record({ kind: "signed_in" })
      // A sign-in never fails on its analytics row.
      .catch((recordError: unknown) => console.error("signed_in event not recorded", recordError));
  }
  throw redirect(href("/sign-in"), { headers });
}
