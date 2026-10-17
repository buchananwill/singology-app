import { Outlet } from "react-router";

import { requireSignedIn } from "../middleware/me";
import type { Route } from "./+types/anyRole.layout";

/** Surfaces shared by both roles (the library): any signed-in user. */
export const middleware: Route.MiddlewareFunction[] = [requireSignedIn];

export default function AnyRoleLayout() {
  return <Outlet />;
}
