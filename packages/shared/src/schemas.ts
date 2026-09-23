import { z } from "zod";

import {
  ASSIGNMENT_STATUSES,
  COACH_TIERS,
  DEMO_ROLES,
  ENROLMENT_STATUSES,
  LIBRARY_CATEGORIES,
  MEDIA_KINDS,
  ROLES,
  SUBMISSION_STATUSES,
  VOICE_TYPES,
} from "./constants";

export const IdSchema = z.string().min(1);
export const IsoDateTimeSchema = z.iso.datetime();

export const CoachTierSchema = z.enum(COACH_TIERS);
export type CoachTier = z.infer<typeof CoachTierSchema>;

export const RoleSchema = z.enum(ROLES);
export type Role = z.infer<typeof RoleSchema>;

export const DemoRoleSchema = z.enum(DEMO_ROLES);
export type DemoRole = z.infer<typeof DemoRoleSchema>;

export const LibraryCategorySchema = z.enum(LIBRARY_CATEGORIES);
export type LibraryCategory = z.infer<typeof LibraryCategorySchema>;

export const VoiceTypeSchema = z.enum(VOICE_TYPES);
export type VoiceType = z.infer<typeof VoiceTypeSchema>;

export const MediaKindSchema = z.enum(MEDIA_KINDS);
export type MediaKind = z.infer<typeof MediaKindSchema>;

export const MediaAssetSchema = z.object({
  id: IdSchema,
  kind: MediaKindSchema,
  /** Progressive file URL, e.g. `/media/student-take.m4a`. */
  src: z.string().min(1),
  /** HLS playlist URL, when an HLS rendition exists. */
  hlsSrc: z.string().min(1).optional(),
  /** Pre-computed wavesurfer peaks JSON URL. */
  peaksSrc: z.string().min(1),
  durationSec: z.number().positive(),
});
export type MediaAsset = z.infer<typeof MediaAssetSchema>;

export const CoachSchema = z.object({
  id: IdSchema,
  displayName: z.string().min(1),
  tier: CoachTierSchema,
  bio: z.string(),
  avatarSrc: z.string().min(1),
  turnaroundHours: z.number().int().positive(),
});
export type Coach = z.infer<typeof CoachSchema>;

export const CoachOfferSchema = z.object({
  id: IdSchema,
  coachId: IdSchema,
  tier: CoachTierSchema,
  name: z.string().min(1),
  /** Monthly price in pence (GBP). */
  pricePencePerMonth: z.number().int().nonnegative(),
  submissionsPerPeriod: z.number().int().positive(),
});
export type CoachOffer = z.infer<typeof CoachOfferSchema>;

export const StudentSchema = z.object({
  id: IdSchema,
  displayName: z.string().min(1),
  voiceType: VoiceTypeSchema,
});
export type Student = z.infer<typeof StudentSchema>;

export const EnrolmentStatusSchema = z.enum(ENROLMENT_STATUSES);
export type EnrolmentStatus = z.infer<typeof EnrolmentStatusSchema>;

export const EnrolmentSchema = z.object({
  id: IdSchema,
  studentId: IdSchema,
  coachId: IdSchema,
  offerId: IdSchema,
  status: EnrolmentStatusSchema,
  currentPeriodEnd: IsoDateTimeSchema,
  submissionsUsed: z.number().int().nonnegative(),
});
export type Enrolment = z.infer<typeof EnrolmentSchema>;

export const LibraryItemSchema = z.object({
  id: IdSchema,
  title: z.string().min(1),
  category: LibraryCategorySchema,
  voiceTypes: z.array(VoiceTypeSchema).min(1),
  instructions: z.string(),
  demoMediaId: IdSchema,
  backingTrackMediaId: IdSchema.optional(),
});
export type LibraryItem = z.infer<typeof LibraryItemSchema>;

export const LibraryFilterSchema = z.object({
  category: LibraryCategorySchema.optional(),
  voiceType: VoiceTypeSchema.optional(),
});
export type LibraryFilter = z.infer<typeof LibraryFilterSchema>;

export const AssignmentStatusSchema = z.enum(ASSIGNMENT_STATUSES);
export type AssignmentStatus = z.infer<typeof AssignmentStatusSchema>;

export const AssignmentSchema = z.object({
  id: IdSchema,
  enrolmentId: IdSchema,
  libraryItemId: IdSchema,
  assignedAt: IsoDateTimeSchema,
  status: AssignmentStatusSchema,
});
export type Assignment = z.infer<typeof AssignmentSchema>;

export const SubmissionStatusSchema = z.enum(SUBMISSION_STATUSES);
export type SubmissionStatus = z.infer<typeof SubmissionStatusSchema>;

export const SubmissionSchema = z.object({
  id: IdSchema,
  enrolmentId: IdSchema,
  assignmentId: IdSchema.optional(),
  libraryItemId: IdSchema,
  mediaId: IdSchema,
  note: z.string(),
  submittedAt: IsoDateTimeSchema,
  status: SubmissionStatusSchema,
});
export type Submission = z.infer<typeof SubmissionSchema>;

export const FeedbackSchema = z.object({
  id: IdSchema,
  submissionId: IdSchema,
  coachId: IdSchema,
  body: z.string(),
  replyMediaId: IdSchema.optional(),
  sentAt: IsoDateTimeSchema,
});
export type Feedback = z.infer<typeof FeedbackSchema>;

export const FeedbackCommentSchema = z.object({
  id: IdSchema,
  feedbackId: IdSchema,
  /** Position in the submission's media, in seconds. */
  tSeconds: z.number().nonnegative(),
  body: z.string().min(1),
});
export type FeedbackComment = z.infer<typeof FeedbackCommentSchema>;
