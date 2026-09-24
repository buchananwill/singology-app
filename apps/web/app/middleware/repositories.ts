import { createFixtureRepositories } from "@singology/db";
import type { MiddlewareFunction } from "react-router";

import { repositoriesContext, requestTimeContext } from "../context";

/** Fixture times are resolved against the same request time the loaders see. */
export const repositoriesMiddleware: MiddlewareFunction<Response> = ({ context }) => {
  const now = new Date();
  context.set(requestTimeContext, now);
  context.set(repositoriesContext, createFixtureRepositories({ now }));
};
