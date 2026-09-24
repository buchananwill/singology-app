import { type DemoRole, DemoRoleSchema } from "@singology/shared";
import { createCookie } from "react-router";

/** Not signed: it only records which view the visitor picked, and is not authentication. */
const demoRoleCookie = createCookie("singology_demo_role", {
  path: "/",
  sameSite: "lax",
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 30,
});

/** An unknown value reads as `null`. */
export async function readDemoRole(request: Request): Promise<DemoRole | null> {
  const parsed = DemoRoleSchema.safeParse(
    await demoRoleCookie.parse(request.headers.get("Cookie")),
  );
  return parsed.success ? parsed.data : null;
}

export function serializeDemoRole(role: DemoRole): Promise<string> {
  return demoRoleCookie.serialize(role);
}
