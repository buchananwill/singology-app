import { createClient } from "@supabase/supabase-js";

import { requireEnv, supabaseUrlFrom } from "./env";

/** The Supabase Auth admin API, with the secret key; for the seed and test sign-in only. */
export function createAuthAdmin() {
  return createClient(
    supabaseUrlFrom(requireEnv("DATABASE_URL")),
    requireEnv("SUPABASE_SECRET_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  ).auth.admin;
}

/** A single-use token hash that `/auth/confirm` exchanges for a session, without sending email. */
export async function magicLinkTokenFor(email: string): Promise<string> {
  const { data, error } = await createAuthAdmin().generateLink({ type: "magiclink", email });
  if (error) {
    throw error;
  }
  return data.properties.hashed_token;
}
