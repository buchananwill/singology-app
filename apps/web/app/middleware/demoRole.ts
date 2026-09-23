import { DEMO_COACH_ID, DEMO_STUDENT_ID } from "@singology/db";
import type { DemoRole } from "@singology/shared";
import { type MiddlewareFunction, redirect } from "react-router";

import { coachIdContext, demoRoleContext, studentIdContext } from "../context";
import { readDemoRole } from "../demo/roleCookie.server";

/** Reads the role cookie into `demoRoleContext` for every request. */
export const demoRoleMiddleware: MiddlewareFunction<Response> = async ({ request, context }) => {
  context.set(demoRoleContext, await readDemoRole(request));
};

/**
 * Guards a role-scoped layout: without the given role (or, when `role` is
 * omitted, without any role) the request is redirected to the role switcher.
 */
export function requireDemoRole(role?: DemoRole): MiddlewareFunction<Response> {
  return ({ context }) => {
    const current = context.get(demoRoleContext);
    if (current === null || (role !== undefined && current !== role)) {
      throw redirect("/demo");
    }
  };
}

/** Puts the fixed demo student on the context for the student surfaces. */
export const demoStudentMiddleware: MiddlewareFunction<Response> = ({ context }) => {
  context.set(studentIdContext, DEMO_STUDENT_ID);
};

/** Puts the fixed demo coach (the founder) on the context for the coach surfaces. */
export const demoCoachMiddleware: MiddlewareFunction<Response> = ({ context }) => {
  context.set(coachIdContext, DEMO_COACH_ID);
};
