import { Outlet } from "react-router";

import { requireDemoRole } from "../middleware/demoRole";
import type { Route } from "./+types/anyRole.layout";

/** Surfaces shared by both roles (the library): any picked role will do. */
export const middleware: Route.MiddlewareFunction[] = [requireDemoRole()];

export default function AnyRoleLayout() {
  return <Outlet />;
}
