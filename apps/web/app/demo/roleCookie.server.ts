import { type DemoRole, DemoRoleSchema } from "@singology/shared";
import { createCookie } from "react-router";

/**
 * The facade's role switcher cookie (spec decision 13). It only records which
 * view the visitor picked; it is not authentication, so it is not signed.
 */
const demoRoleCookie = createCookie("singology_demo_role", {
  path: "/",
  sameSite: "lax",
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 30,
});

/** The role in the request's cookie, or `null` when none (or an unknown value) is set. */
export async function readDemoRole(request: Request): Promise<DemoRole | null> {
  const parsed = DemoRoleSchema.safeParse(
    await demoRoleCookie.parse(request.headers.get("Cookie")),
  );
  return parsed.success ? parsed.data : null;
}

/** A `Set-Cookie` header value that stores `role`. */
export function serializeDemoRole(role: DemoRole): Promise<string> {
  return demoRoleCookie.serialize(role);
}
