import { createFixtureRepositories } from "@singology/db";
import type { MiddlewareFunction } from "react-router";

import { repositoriesContext, requestTimeContext } from "../context";

/**
 * Puts the request time and the fixture repositories on the request context
 * for every request. Fixture times are resolved against that same request
 * time (journal decision 32).
 */
export const repositoriesMiddleware: MiddlewareFunction<Response> = ({ context }) => {
  const now = new Date();
  context.set(requestTimeContext, now);
  context.set(repositoriesContext, createFixtureRepositories({ now }));
};
