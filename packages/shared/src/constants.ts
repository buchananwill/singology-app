/** The founder coaches on the premium tier. */
export const COACH_TIERS = ["premium", "standard"] as const;

/** A monthly plan with a set number of reviews, or one single review. */
export const OFFER_BILLING = ["monthly", "single"] as const;

/** The roles a visitor can pick on the facade's role switcher. */
export const DEMO_ROLES = ["student", "coach"] as const;

export const LIBRARY_CATEGORIES = ["breath", "onset", "range", "agility"] as const;

export const VOICE_TYPES = ["soprano", "mezzo", "alto", "tenor", "baritone", "bass"] as const;

export const MEDIA_KINDS = ["audio", "video"] as const;

export const ENROLMENT_STATUSES = ["active", "paused", "ended"] as const;

export const ASSIGNMENT_STATUSES = ["todo", "submitted", "feedback_ready"] as const;

export const SUBMISSION_STATUSES = ["awaiting_review", "reviewed"] as const;

export const HLS_MIME_TYPE = "application/vnd.apple.mpegurl";

export const MINUTE_MS = 60 * 1000;
export const HOUR_MS = 60 * MINUTE_MS;
