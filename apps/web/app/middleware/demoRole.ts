import { DEMO_COACH_ID, DEMO_STUDENT_ID } from "@singology/db";
import type { DemoRole } from "@singology/shared";
import { href, type MiddlewareFunction, redirect } from "react-router";

import { coachIdContext, demoRoleContext, studentIdContext } from "../context";
import { readDemoRole } from "../demo/roleCookie.server";

export const demoRoleMiddleware: MiddlewareFunction<Response> = async ({ request, context }) => {
  context.set(demoRoleContext, await readDemoRole(request));
};

/** Without `role` (or any role, when it is omitted) the request is redirected to `/demo`. */
export function requireDemoRole(role?: DemoRole): MiddlewareFunction<Response> {
  return ({ context }) => {
    const current = context.get(demoRoleContext);
    if (current === null || (role !== undefined && current !== role)) {
      throw redirect(href("/demo"));
    }
  };
}

export const demoStudentMiddleware: MiddlewareFunction<Response> = ({ context }) => {
  context.set(studentIdContext, DEMO_STUDENT_ID);
};

export const demoCoachMiddleware: MiddlewareFunction<Response> = ({ context }) => {
  context.set(coachIdContext, DEMO_COACH_ID);
};
