import { Outlet } from "react-router";

import { demoStudentMiddleware, requireDemoRole } from "../middleware/demoRole";
import type { Route } from "./+types/student.layout";

/** The student surfaces: only with the student role, always as the demo student. */
export const middleware: Route.MiddlewareFunction[] = [
  requireDemoRole("student"),
  demoStudentMiddleware,
];

export default function StudentLayout() {
  return <Outlet />;
}
