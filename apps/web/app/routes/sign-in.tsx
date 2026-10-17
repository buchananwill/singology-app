import { Alert, Button, Container, Stack, TextInput } from "@mantine/core";
import { SignInSchema } from "@singology/shared";
import type { AuthError } from "@supabase/supabase-js";
import { data, Form, href, redirect } from "react-router";

import { logAuthError } from "../auth/logAuthError";
import { isSignInLinkFailed } from "../auth/signInLinkFailed";
import { claimsContext, meContext, supabaseContext } from "../context";
import { type MessageResult, parseInput } from "../lib/actionResult";
import { homeFor } from "../lib/roles";
import { PageTitle } from "../components/shell/PageTitle";
import type { Route } from "./+types/sign-in";

export const meta: Route.MetaFunction = () => [{ title: "Sign in | Singology" }];

// What Supabase answers for an address it does not know when sign-up is off.
const UNREGISTERED_ADDRESS: Extract<AuthError["code"], "otp_disabled"> = "otp_disabled";

export function loader({ context, request }: Route.LoaderArgs) {
  const me = context.get(meContext);
  if (me !== null) {
    throw redirect(homeFor(me));
  }
  return {
    linkFailed: isSignInLinkFailed(new URL(request.url)),
    // Signed in, but the seed gave this user no profile.
    notSetUp: context.get(claimsContext).role === "authenticated",
  };
}

export async function action({ context, request }: Route.ActionArgs) {
  const parsed = parseInput(
    SignInSchema,
    Object.fromEntries(await request.formData()),
    "The sign-in form was not valid.",
  );
  if (!parsed.ok) {
    return data<MessageResult>({ ok: false, error: parsed.error }, { status: 400 });
  }
  const { client, headers } = context.get(supabaseContext);
  // shouldCreateUser: false is what keeps the alpha invite-only.
  const { error } = await client.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: new URL(href("/auth/confirm"), request.url).href,
      shouldCreateUser: false,
    },
  });
  if (error !== null && error.code !== UNREGISTERED_ADDRESS) {
    logAuthError("signInWithOtp", error);
  }
  // The same answer whatever happened, so the page does not reveal which addresses are registered.
  return data<MessageResult>(
    { ok: true, message: "If that address is registered, a sign-in link is on its way." },
    { headers },
  );
}

export default function SignIn({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <Container size="xs">
      <Stack gap="md">
        <PageTitle
          title="Sign in"
          description="We'll email you a link that signs you in. No password needed."
        />
        {loaderData.notSetUp ? (
          <Alert color="olive" variant="light" data-testid="sign-in-not-set-up">
            This account isn't set up yet. Ask the Singology team.
          </Alert>
        ) : (
          <>
            {loaderData.linkFailed && actionData === undefined && (
              <Alert color="red" variant="light" data-testid="sign-in-link-failed">
                That sign-in link has expired or was already used. Ask for a new one below.
              </Alert>
            )}
            {actionData?.ok === true ? (
              <Alert variant="light" role="status" data-testid="sign-in-sent">
                {actionData.message}
              </Alert>
            ) : (
              <Form method="post">
                <Stack gap="sm">
                  <TextInput
                    name="email"
                    type="email"
                    label="Email"
                    autoComplete="email"
                    required
                    error={actionData?.ok === false ? actionData.error : undefined}
                  />
                  <Button type="submit">Email me a sign-in link</Button>
                </Stack>
              </Form>
            )}
          </>
        )}
      </Stack>
    </Container>
  );
}
