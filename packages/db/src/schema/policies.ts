import { type SQL, sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { authUid } from "drizzle-orm/supabase";

import type { EnrolmentParty } from "../enrolmentParty";
import { submissions } from "./coaching";
import { enrolments } from "./enrolments";

export interface EnrolmentPolicyOptions {
  activeOnly?: boolean;
}

/** The row's enrolment has the caller as `party` (and, with `activeOnly`, is active). */
export function enrolmentIsCallers(
  party: EnrolmentParty,
  enrolmentId: AnyPgColumn,
  { activeOnly = false }: EnrolmentPolicyOptions = {},
): SQL {
  const active = activeOnly ? sql` and ${enrolments.status} = 'active'` : sql``;
  return sql`exists (
    select 1 from ${enrolments}
    where ${enrolments.id} = ${enrolmentId} and ${enrolments[party]} = ${authUid}${active}
  )`;
}

/** The row's user is on the other side of an enrolment that has the caller as `callerParty`. */
export function isEnrolledWithCaller(callerParty: EnrolmentParty, userId: AnyPgColumn): SQL {
  const otherParty: EnrolmentParty = callerParty === "studentId" ? "coachId" : "studentId";
  return sql`exists (
    select 1 from ${enrolments}
    where ${enrolments[otherParty]} = ${userId} and ${enrolments[callerParty]} = ${authUid}
  )`;
}

/** The row's submission is on an enrolment that has the caller as `party`. */
export function submissionIsCallers(party: EnrolmentParty, submissionId: AnyPgColumn): SQL {
  return sql`exists (
    select 1 from ${submissions}
    inner join ${enrolments} on ${enrolments.id} = ${submissions.enrolmentId}
    where ${submissions.id} = ${submissionId} and ${enrolments[party]} = ${authUid}
  )`;
}
