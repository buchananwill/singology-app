import { type Me, USER_ROLES, type UserRole } from "@singology/shared";
import { href } from "react-router";

/** `Me` names each role's row after the role, and the row is present when the role is held. */
export function holdsRole(me: Me, role: UserRole): boolean {
  return me[role] !== null;
}

export function rolesOf(me: Me): UserRole[] {
  return USER_ROLES.filter((role) => holdsRole(me, role));
}

/** A student who also coaches lands on the student home and reaches the queue from the nav. */
export function homeFor(me: Me | null): string {
  if (me !== null && holdsRole(me, "student")) {
    return href("/student");
  }
  if (me !== null && holdsRole(me, "coach")) {
    return href("/coach");
  }
  return href("/");
}
