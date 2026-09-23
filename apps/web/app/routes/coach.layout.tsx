import { Outlet } from "react-router";

import { demoCoachMiddleware, requireDemoRole } from "../middleware/demoRole";
import type { Route } from "./+types/coach.layout";

/** The coach surfaces: only with the coach role, always as the demo coach. */
export const middleware: Route.MiddlewareFunction[] = [
  requireDemoRole("coach"),
  demoCoachMiddleware,
];

export default function CoachLayout() {
  return <Outlet />;
}
