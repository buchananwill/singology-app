import type { RouterContextProvider } from "react-router";

export interface RouteArgs<Params> {
  context: RouterContextProvider;
  request: Request;
  url: URL;
  params: Params;
  pattern: string;
}

/** The arguments React Router passes a loader or action, for calling one from a unit test. */
export function routeArgs<Params>(
  context: RouterContextProvider,
  request: Request,
  pattern: string,
  params: Params,
): RouteArgs<Params> {
  return { context, request, url: new URL(request.url), params, pattern };
}
