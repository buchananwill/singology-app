import {
  type Claims,
  createDrizzleRepositories,
  createUserDb,
  type Repositories,
} from "@singology/db";
import { env } from "cloudflare:workers";
import type { MiddlewareFunction } from "react-router";

import { claimsContext, repositoriesContext, requestTimeContext } from "../context";

/** The one place the app builds repositories; the confirm route needs them for a new session. */
export function repositoriesFor(claims: Claims, now: Date): Repositories {
  return createDrizzleRepositories(createUserDb(env.HYPERDRIVE, claims), { now });
}

export const repositoriesMiddleware: MiddlewareFunction<Response> = ({ context }) => {
  const now = new Date();
  context.set(requestTimeContext, now);
  context.set(repositoriesContext, repositoriesFor(context.get(claimsContext), now));
};
