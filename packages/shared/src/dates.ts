import type { IsoDate } from "./schemas";

/** The UTC calendar date of an instant. */
export function isoDate(at: Date): IsoDate {
  return at.toISOString().slice(0, 10);
}

/** UTC midnight at the start of a date. */
export function startOfIsoDate(date: IsoDate): Date {
  return new Date(`${date}T00:00:00Z`);
}

/** The Monday of `now`'s ISO week, in UTC. */
export function isoWeekStart(now: Date): IsoDate {
  const daysSinceMonday = (now.getUTCDay() + 6) % 7;
  return isoDate(
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysSinceMonday)),
  );
}
