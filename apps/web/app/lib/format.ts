import {
  type AssignmentStatus,
  type CoachTier,
  type Difficulty,
  type LibraryCategory,
  type MediaKind,
  MINUTE_MS,
  type ReviewSlaState,
  type UnplayableStatus,
  type UserRole,
  type VoiceType,
} from "@singology/shared";

// Dates are formatted by hand in UTC: workerd and browsers ship different ICU data, which would break hydration.

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

/** Truncated like a player's clock, to match the waveform markers. */
export function formatTimestamp(seconds: number): string {
  return formatDuration(Math.floor(Math.max(0, seconds)));
}

/** Counts in hours below `hoursUntilDays`, so a review window reads precisely. */
function formatElapsed(ms: number, hoursUntilDays: number): string {
  const minutes = Math.floor(Math.max(0, ms) / MINUTE_MS);
  if (minutes < 1) {
    return "just now";
  }
  if (minutes < 60) {
    return `${minutes} min ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < hoursUntilDays) {
    return `${formatCount(hours, "hour", "hours")} ago`;
  }
  return `${Math.floor(hours / 24)} days ago`;
}

export function formatSince(iso: string, nowMs: number, hoursUntilDays: number): string {
  return formatElapsed(nowMs - new Date(iso).getTime(), hoursUntilDays);
}

export function formatCount(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

export function formatTurnaround(hours: number): string {
  if (hours % 24 === 0) {
    return formatCount(hours / 24, "day", "days");
  }
  return formatCount(hours, "hour", "hours");
}

/** Time left before a deadline: `46h 05m left`, `9m left`; `overdue` once it has passed. */
export function formatTimeLeft(ms: number): string {
  if (ms <= 0) {
    return "overdue";
  }
  const minutes = Math.floor(ms / MINUTE_MS);
  const hours = Math.floor(minutes / 60);
  if (hours === 0) {
    return `${minutes}m left`;
  }
  return `${hours}h ${String(minutes % 60).padStart(2, "0")}m left`;
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

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  beginner: "Beginner",
  improver: "Improver",
  intermediate: "Intermediate",
  advanced: "Advanced",
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
  submitted: "olive",
  feedback_ready: "brand",
};

export const UNPLAYABLE_TAKE_MESSAGE: Record<UnplayableStatus, string> = {
  processing: "This take is still processing, so there is nothing to play yet.",
  failed: "This take couldn't be processed. Ask the student to upload it again.",
};

export const COACH_TIER_LABEL: Record<CoachTier, string> = {
  premium: "Founder tier",
  standard: "Standard tier",
};

export const SLA_COLOR: Record<ReviewSlaState, string> = {
  on_track: "brand",
  due_soon: "olive",
  overdue: "red",
};

export const ROLE_LABEL: Record<UserRole, string> = {
  student: "Student",
  coach: "Coach",
};

export const MEDIA_KIND_LABEL: Record<MediaKind, string> = {
  audio: "Audio",
  video: "Video",
};
