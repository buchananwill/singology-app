import { Outlet } from "react-router";

import { requireCoach } from "../middleware/me";
import type { Route } from "./+types/coach.layout";

export const middleware: Route.MiddlewareFunction[] = [requireCoach];

export default function CoachLayout() {
  return <Outlet />;
}
