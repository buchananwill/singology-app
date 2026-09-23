import type {
  AssignmentStatus,
  CoachTier,
  LibraryCategory,
  VoiceType,
} from "@singology/shared";

/**
 * Display formatting shared by the routes. Dates are formatted by hand in UTC
 * rather than with `Intl.DateTimeFormat`: the server (workerd) and each
 * browser ship different ICU data (e.g. "Sep" versus "Sept" for en-GB), and
 * any difference would be a hydration mismatch.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** `2500` → `£25`, `4550` → `£45.50`. */
export function formatPence(pence: number): string {
  const pounds = Math.floor(pence / 100);
  const rest = pence % 100;
  return rest === 0 ? `£${pounds}` : `£${pounds}.${String(rest).padStart(2, "0")}`;
}

/** An ISO date-time as `8 Sep 2026` (UTC). */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** Seconds as `m:ss`. */
export function formatDuration(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/** A byte count as `512 B`, `1.2 KB` or `3.4 MB`. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const CATEGORY_LABEL: Record<LibraryCategory, string> = {
  breath: "Breath",
  onset: "Onset",
  range: "Range",
  agility: "Agility",
};

export const VOICE_TYPE_LABEL: Record<VoiceType, string> = {
  soprano: "Soprano",
  mezzo: "Mezzo",
  alto: "Alto",
  tenor: "Tenor",
  baritone: "Baritone",
  bass: "Bass",
};

export const ASSIGNMENT_STATUS_LABEL: Record<AssignmentStatus, string> = {
  todo: "To do",
  submitted: "Submitted",
  feedback_ready: "Feedback ready",
};

export const ASSIGNMENT_STATUS_COLOR: Record<AssignmentStatus, string> = {
  todo: "gray",
  submitted: "blue",
  feedback_ready: "green",
};

export const COACH_TIER_LABEL: Record<CoachTier, string> = {
  premium: "Founder tier",
  standard: "Standard tier",
};
