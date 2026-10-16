import { Outlet } from "react-router";

import { requireStudent } from "../middleware/me";
import type { Route } from "./+types/student.layout";

export const middleware: Route.MiddlewareFunction[] = [requireStudent()];

export default function StudentLayout() {
  return <Outlet />;
}
