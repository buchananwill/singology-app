import { createDrizzleRepositories, createUserDb } from "@singology/db";
import { env } from "cloudflare:workers";
import type { MiddlewareFunction } from "react-router";

import { claimsContext, repositoriesContext, requestTimeContext } from "../context";

export const repositoriesMiddleware: MiddlewareFunction<Response> = ({ context }) => {
  const now = new Date();
  context.set(requestTimeContext, now);
  context.set(
    repositoriesContext,
    createDrizzleRepositories(createUserDb(env.HYPERDRIVE, context.get(claimsContext)), { now }),
  );
};
