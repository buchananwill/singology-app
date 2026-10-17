import { type Me, USER_ROLES, type UserRole } from "@singology/shared";
import { href } from "react-router";

export const ROLE_HOME: Record<UserRole, string> = {
  student: href("/student"),
  coach: href("/coach"),
};

export function holdsRole<R extends UserRole>(
  me: Me,
  role: R,
): me is Me & Record<R, NonNullable<Me[R]>> {
  return me[role] !== null;
}

export function rolesOf(me: Me): UserRole[] {
  return USER_ROLES.filter((role) => holdsRole(me, role));
}

/** A student who also coaches lands on the student home and reaches the queue from the nav. */
export function homeFor(me: Me | null): string {
  const [first] = me === null ? [] : rolesOf(me);
  return first === undefined ? href("/") : ROLE_HOME[first];
}
