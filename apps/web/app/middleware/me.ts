import type { Me, UserRole } from "@singology/shared";
import {
  data,
  href,
  type MiddlewareFunction,
  redirect,
  type RouterContextProvider,
} from "react-router";

import {
  claimsContext,
  coachIdContext,
  meContext,
  repositoriesContext,
  studentIdContext,
} from "../context";

// Anonymous requests skip the round trip: they have no profile to read.
export const meMiddleware: MiddlewareFunction<Response> = async ({ context }) => {
  const anonymous = context.get(claimsContext).role === "anon";
  context.set(meContext, anonymous ? null : await context.get(repositoriesContext).me.get());
};

function signedInOrRedirect(context: Readonly<RouterContextProvider>): Me {
  const me = context.get(meContext);
  if (me === null) {
    throw redirect(href("/sign-in"));
  }
  return me;
}

const ROLE_ID_CONTEXT = { student: studentIdContext, coach: coachIdContext } as const;

const ROLE_REFUSAL = { student: "Not a student", coach: "Not a coach" } as const satisfies Record<
  UserRole,
  string
>;

// A signed-in user without the role is known and refused (403), not sent to sign in.
function requireRole(role: UserRole): MiddlewareFunction<Response> {
  return ({ context }) => {
    const row = signedInOrRedirect(context)[role];
    if (row === null) {
      throw data(ROLE_REFUSAL[role], { status: 403 });
    }
    context.set(ROLE_ID_CONTEXT[role], row.id);
  };
}

export const requireSignedIn: MiddlewareFunction<Response> = ({ context }) => {
  signedInOrRedirect(context);
};

export const requireStudent = requireRole("student");

export const requireCoach = requireRole("coach");
