import { createFixtureRepositories } from "@singology/db";
import type { MiddlewareFunction } from "react-router";

import { repositoriesContext } from "../context";

/**
 * Puts the fixture repositories on the request context for every request,
 * with fixture times resolved against the request time (journal decision 32).
 */
export const repositoriesMiddleware: MiddlewareFunction<Response> = ({ context }) => {
  context.set(repositoriesContext, createFixtureRepositories({ now: new Date() }));
};
