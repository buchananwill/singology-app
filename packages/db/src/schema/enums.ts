import {
  COACH_TIERS,
  DIFFICULTIES,
  ENROLMENT_STATUSES,
  LIBRARY_CATEGORIES,
  MEDIA_KINDS,
  MEDIA_STATUSES,
  MEDIA_STORES,
  NOTIFICATION_KINDS,
  OFFER_BILLING,
  SUBMISSION_STATUSES,
  VOICE_TYPES,
} from "@singology/shared";
import { pgEnum } from "drizzle-orm/pg-core";

export const coachTier = pgEnum("coach_tier", COACH_TIERS);
export const offerBilling = pgEnum("offer_billing", OFFER_BILLING);
export const voiceType = pgEnum("voice_type", VOICE_TYPES);
export const libraryCategory = pgEnum("library_category", LIBRARY_CATEGORIES);
export const difficulty = pgEnum("difficulty", DIFFICULTIES);
export const mediaKind = pgEnum("media_kind", MEDIA_KINDS);
export const enrolmentStatus = pgEnum("enrolment_status", ENROLMENT_STATUSES);
export const submissionStatus = pgEnum("submission_status", SUBMISSION_STATUSES);
export const mediaStore = pgEnum("media_store", MEDIA_STORES);
export const mediaStatus = pgEnum("media_status", MEDIA_STATUSES);
export const notificationKind = pgEnum("notification_kind", NOTIFICATION_KINDS);
