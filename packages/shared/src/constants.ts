/** Coach pricing tiers. The founder coaches on the premium tier. */
export const COACH_TIERS = ["premium", "standard"] as const;

/** Every role in the WP4 data model. */
export const ROLES = ["student", "coach", "admin", "guardian"] as const;

/** The roles a visitor can pick on the facade's role switcher. */
export const DEMO_ROLES = ["student", "coach"] as const;

/** Exercise library categories. */
export const LIBRARY_CATEGORIES = ["breath", "onset", "range", "agility"] as const;

export const VOICE_TYPES = [
  "soprano",
  "mezzo",
  "alto",
  "tenor",
  "baritone",
  "bass",
] as const;

export const MEDIA_KINDS = ["audio", "video"] as const;

export const ENROLMENT_STATUSES = ["active", "paused", "ended"] as const;

export const ASSIGNMENT_STATUSES = ["todo", "submitted", "feedback_ready"] as const;

export const SUBMISSION_STATUSES = ["awaiting_review", "reviewed"] as const;

/** The coach turnaround promise, in hours, that the review queue counts down against. */
export const REVIEW_TURNAROUND_HOURS = 72;
