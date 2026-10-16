import type { Me } from "@singology/shared";
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

export function requireSignedIn(): MiddlewareFunction<Response> {
  return ({ context }) => {
    signedInOrRedirect(context);
  };
}

/** A signed-in user without a student row is known and refused (403), not sent to sign in. */
export function requireStudent(): MiddlewareFunction<Response> {
  return ({ context }) => {
    const { student } = signedInOrRedirect(context);
    if (student === null) {
      throw data("Not a student", { status: 403 });
    }
    context.set(studentIdContext, student.id);
  };
}

/** A signed-in user without a coach row is known and refused (403), not sent to sign in. */
export function requireCoach(): MiddlewareFunction<Response> {
  return ({ context }) => {
    const { coach } = signedInOrRedirect(context);
    if (coach === null) {
      throw data("Not a coach", { status: 403 });
    }
    context.set(coachIdContext, coach.id);
  };
}
