/** The founder coaches on the premium tier. */
export const COACH_TIERS = ["premium", "standard"] as const;

/** A monthly plan with a set number of reviews, or one single review. */
export const OFFER_BILLING = ["monthly", "single"] as const;

/** In display order: the nav and the header list a user's roles in this order. */
export const USER_ROLES = ["student", "coach"] as const;

export const LIBRARY_CATEGORIES = ["breath", "onset", "range", "agility"] as const;

export const VOICE_TYPES = ["soprano", "mezzo", "alto", "tenor", "baritone", "bass"] as const;

export const MEDIA_KINDS = ["audio", "video"] as const;

export const ENROLMENT_STATUSES = ["active", "paused", "ended"] as const;

export const ASSIGNMENT_STATUSES = ["todo", "submitted", "feedback_ready"] as const;

/** `processing` until the media job has peaks; `failed` when it could not make them. */
export const SUBMISSION_STATUSES = ["processing", "awaiting_review", "reviewed", "failed"] as const;

/** The review workspace's two faces; `reviewed` is read-only because sent feedback is immutable. */
export const REVIEW_MODES = ["reviewing", "reviewed"] as const;

/** In ascending order: a sort by difficulty follows this array. */
export const DIFFICULTIES = ["beginner", "improver", "intermediate", "advanced"] as const;

/** Open-ended label facets: a new facet is a new value here, never a migration. */
export const TAG_KINDS = ["focus"] as const;

/** `local` is the app's own `/media/*` path, used by seeded media until Bunny is switched on. */
export const MEDIA_STORES = ["local", "bunny_stream", "bunny_storage"] as const;

export const MEDIA_STATUSES = ["pending", "ready", "failed"] as const;

/** Stored as text, so adding a kind is never a migration. */
export const EVENT_KINDS = [
  "signed_in",
  "submission_created",
  "feedback_sent",
  "feedback_viewed",
] as const;

export const NOTIFICATION_KINDS = [
  "feedback_ready",
  "new_submission",
  "practice_reminder",
] as const;

/** The nudge sender's Cron Triggers by name. */
export const NUDGE_CRONS = { frequent: "*/5 * * * *", weekly: "0 9 * * 4" } as const;

export const HLS_MIME_TYPE = "application/vnd.apple.mpegurl";

export const MINUTE_MS = 60 * 1000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;
