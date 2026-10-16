import { Alert, Button, Container, Stack, Text, TextInput, Title } from "@mantine/core";
import { SignInSchema } from "@singology/shared";
import { data, Form, href, redirect } from "react-router";

import { isSignInLinkFailed } from "../auth/signInLinkFailed";
import { createSupabaseServerClient } from "../auth/supabase.server";
import { homeFor } from "../components/shell/navItems";
import { meContext } from "../context";
import { type MessageResult, parseInput } from "../lib/actionResult";
import type { Route } from "./+types/sign-in";

export const meta: Route.MetaFunction = () => [{ title: "Sign in | Singology" }];

// A signed-in visitor goes home; `/auth/confirm` relies on this to land a new session there.
export function loader({ context, request }: Route.LoaderArgs) {
  const me = context.get(meContext);
  if (me !== null) {
    throw redirect(homeFor(me));
  }
  return { linkFailed: isSignInLinkFailed(new URL(request.url)) };
}

export async function action({ request }: Route.ActionArgs) {
  const parsed = parseInput(
    SignInSchema,
    Object.fromEntries(await request.formData()),
    "Enter an email address.",
  );
  if (!parsed.ok) {
    return data<MessageResult>({ ok: false, error: parsed.error }, { status: 400 });
  }
  const headers = new Headers();
  // The outcome is never shown, so the page does not reveal which addresses are registered;
  // shouldCreateUser: false is what keeps the alpha invite-only.
  await createSupabaseServerClient(request, headers).auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: new URL(href("/auth/confirm"), request.url).href,
      shouldCreateUser: false,
    },
  });
  return data<MessageResult>(
    { ok: true, message: "If that address is registered, a sign-in link is on its way." },
    { headers },
  );
}

export default function SignIn({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <Container size="xs">
      <Stack gap="md">
        <div>
          <Title order={1}>Sign in</Title>
          <Text c="dimmed">We'll email you a link that signs you in. No password needed.</Text>
        </div>
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
      </Stack>
    </Container>
  );
}
