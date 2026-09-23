import { Outlet } from "react-router";

import { requireDemoRole } from "../middleware/demoRole";
import type { Route } from "./+types/coach.layout";

/** The coach surfaces: only with the coach role. */
export const middleware: Route.MiddlewareFunction[] = [requireDemoRole("coach")];

export default function CoachLayout() {
  return <Outlet />;
}
