import type { RouterContextProvider } from "react-router";

/** The arguments React Router passes a loader or action, for calling one from a unit test. */
export function routeArgs<Params>(
  context: RouterContextProvider,
  request: Request,
  pattern: string,
  params: Params,
) {
  return { context, request, url: new URL(request.url), params, pattern };
}
