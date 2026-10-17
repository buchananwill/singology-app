/** The UTC calendar date of an instant, as `YYYY-MM-DD`. */
export function isoDate(at: Date): string {
  return at.toISOString().slice(0, 10);
}

/** UTC midnight at the start of a `YYYY-MM-DD` date. */
export function startOfIsoDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

/** The Monday of `now`'s ISO week, in UTC. */
export function isoWeekStart(now: Date): string {
  const daysSinceMonday = (now.getUTCDay() + 6) % 7;
  return isoDate(
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysSinceMonday)),
  );
}
