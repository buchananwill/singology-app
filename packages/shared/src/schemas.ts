import { z } from "zod";

import {
  ASSIGNMENT_STATUSES,
  COACH_TIERS,
  DEMO_ROLES,
  DIFFICULTIES,
  ENROLMENT_STATUSES,
  EVENT_KINDS,
  LIBRARY_CATEGORIES,
  MEDIA_KINDS,
  MEDIA_STATUSES,
  MEDIA_STORES,
  NOTIFICATION_KINDS,
  OFFER_BILLING,
  SUBMISSION_STATUSES,
  TAG_KINDS,
  VOICE_TYPES,
} from "./constants";

export const IdSchema = z.string().min(1);
export const IsoDateTimeSchema = z.iso.datetime();

export const CoachTierSchema = z.enum(COACH_TIERS);
export type CoachTier = z.infer<typeof CoachTierSchema>;

export const DemoRoleSchema = z.enum(DEMO_ROLES, { error: "Pick one of the two views." });
export type DemoRole = z.infer<typeof DemoRoleSchema>;

export const DemoRoleChoiceSchema = z.object({ role: DemoRoleSchema });

export const LibraryCategorySchema = z.enum(LIBRARY_CATEGORIES);
export type LibraryCategory = z.infer<typeof LibraryCategorySchema>;

export const VoiceTypeSchema = z.enum(VOICE_TYPES);
export type VoiceType = z.infer<typeof VoiceTypeSchema>;

export const MediaKindSchema = z.enum(MEDIA_KINDS);
export type MediaKind = z.infer<typeof MediaKindSchema>;

export const MediaStoreSchema = z.enum(MEDIA_STORES);
export type MediaStore = z.infer<typeof MediaStoreSchema>;

export const MediaStatusSchema = z.enum(MEDIA_STATUSES);
export type MediaStatus = z.infer<typeof MediaStatusSchema>;

export const DifficultySchema = z.enum(DIFFICULTIES);
export type Difficulty = z.infer<typeof DifficultySchema>;

export const TagKindSchema = z.enum(TAG_KINDS);
export type TagKind = z.infer<typeof TagKindSchema>;

export const EventKindSchema = z.enum(EVENT_KINDS);
export type EventKind = z.infer<typeof EventKindSchema>;

export const NotificationKindSchema = z.enum(NOTIFICATION_KINDS);
export type NotificationKind = z.infer<typeof NotificationKindSchema>;

/** The ready projection of a stored media asset: playable, with peaks and a duration. */
export const MediaAssetSchema = z.object({
  id: IdSchema,
  kind: MediaKindSchema,
  /** Progressive file URL, e.g. `/media/student-take.m4a`. */
  src: z.string().min(1),
  hlsSrc: z.string().min(1).optional(),
  peaksSrc: z.string().min(1),
  durationSec: z.number().positive(),
});
export type MediaAsset = z.infer<typeof MediaAssetSchema>;

/** `peaks` is `[maxima, minima]` per bin, passed straight to wavesurfer. */
export const WaveformPeaksSchema = z.object({
  version: z.literal(1),
  peaksPerSecond: z.number().int().positive(),
  /** As measured by ffprobe. */
  duration: z.number().positive(),
  peaks: z.tuple([z.array(z.number().min(-1).max(1)), z.array(z.number().min(-1).max(1))]),
});
export type WaveformPeaks = z.infer<typeof WaveformPeaksSchema>;

export const CoachSchema = z.object({
  id: IdSchema,
  displayName: z.string().min(1),
  tier: CoachTierSchema,
  bio: z.string(),
  avatarSrc: z.string().min(1),
  turnaroundHours: z.number().int().positive(),
});
export type Coach = z.infer<typeof CoachSchema>;

export const OfferBillingSchema = z.enum(OFFER_BILLING);
export type OfferBilling = z.infer<typeof OfferBillingSchema>;

export const CoachOfferSchema = z.object({
  id: IdSchema,
  coachId: IdSchema,
  tier: CoachTierSchema,
  name: z.string().min(1),
  billing: OfferBillingSchema,
  /** Price in pence (GBP): per month for `monthly`, per review for `single`. */
  pricePence: z.number().int().nonnegative(),
  /** Reviews included: per month for `monthly`, always 1 for `single`. */
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
  startedAt: IsoDateTimeSchema,
});
export type Enrolment = z.infer<typeof EnrolmentSchema>;

export const TagSchema = z.object({
  kind: TagKindSchema,
  slug: z.string().min(1),
  label: z.string().min(1),
});
export type Tag = z.infer<typeof TagSchema>;

export const LibraryItemSchema = z.object({
  id: IdSchema,
  title: z.string().min(1),
  category: LibraryCategorySchema,
  difficulty: DifficultySchema,
  voiceTypes: z.array(VoiceTypeSchema).min(1),
  tags: z.array(TagSchema),
  instructions: z.string(),
  demoMediaId: IdSchema,
  backingTrackMediaId: IdSchema.optional(),
});
export type LibraryItem = z.infer<typeof LibraryItemSchema>;

/** `itemIds` are in the collection's order; an item may sit in several collections. */
export const CollectionSchema = z.object({
  id: IdSchema,
  title: z.string().min(1),
  description: z.string(),
  position: z.number().int(),
  itemIds: z.array(IdSchema),
});
export type Collection = z.infer<typeof CollectionSchema>;

// An unknown filter value is ignored rather than rejected. `tag` is a tag slug.
export const LibraryFilterSchema = z.object({
  category: LibraryCategorySchema.optional().catch(undefined),
  voiceType: VoiceTypeSchema.optional().catch(undefined),
  difficulty: DifficultySchema.optional().catch(undefined),
  tag: z.string().min(1).optional().catch(undefined),
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

export const MediaMimeTypeSchema = z
  .string()
  .regex(/^(audio|video)\//, "Pick an audio or video file.");

export const UploadFileNameSchema = z.string().min(1).max(255);

export const SubmissionNoteSchema = z.string().max(1000);

/** The picked file's metadata, never the file itself. */
export const RecordingUploadSchema = z.object({
  fileName: UploadFileNameSchema,
  sizeBytes: z.coerce.number().int().positive(),
  durationSec: z.coerce.number().positive().finite(),
  mimeType: MediaMimeTypeSchema,
  note: SubmissionNoteSchema.default(""),
});
export type RecordingUpload = z.infer<typeof RecordingUploadSchema>;

export const ReplyUploadSchema = RecordingUploadSchema.extend({ intent: z.literal("reply") });
export type ReplyUpload = z.infer<typeof ReplyUploadSchema>;

export const FeedbackCommentSchema = z.object({
  id: IdSchema,
  feedbackId: IdSchema,
  /** Position in the submission's media, in seconds. */
  tSeconds: z.number().nonnegative(),
  body: z.string().min(1),
});
export type FeedbackComment = z.infer<typeof FeedbackCommentSchema>;

/** A timestamped comment as the coach sends it: no ids yet, those are the server's job. */
export const DraftFeedbackCommentSchema = z.object({
  tSeconds: z.number().nonnegative().finite(),
  body: z.string().trim().min(1, "A comment can't be empty.").max(500),
});
export type DraftFeedbackComment = z.infer<typeof DraftFeedbackCommentSchema>;

/** The submission comes from the URL, not the payload. */
export const SendFeedbackSchema = z
  .object({
    intent: z.literal("send"),
    summary: z.string().trim().max(2000).default(""),
    comments: z.array(DraftFeedbackCommentSchema).max(100),
    reply: RecordingUploadSchema.nullable(),
    assignLibraryItemIds: z
      .array(IdSchema)
      .max(20)
      .refine((ids) => new Set(ids).size === ids.length, "Each exercise can be assigned once."),
  })
  .refine(
    (feedback) =>
      feedback.comments.length > 0 || feedback.summary !== "" || feedback.reply !== null,
    {
      message: "Add a comment, a summary or a reply before sending.",
      path: ["comments"],
    },
  );
export type SendFeedback = z.infer<typeof SendFeedbackSchema>;

/** What the repository persists: the review, the submission it answers and the registered reply. */
export const SendFeedbackInputSchema = SendFeedbackSchema.safeExtend({
  submissionId: IdSchema,
  replyMediaId: IdSchema.optional(),
});
export type SendFeedbackInput = z.infer<typeof SendFeedbackInputSchema>;

export const CreateSubmissionSchema = SubmissionSchema.pick({
  enrolmentId: true,
  assignmentId: true,
  libraryItemId: true,
  mediaId: true,
}).extend({ note: SubmissionNoteSchema });
export type CreateSubmission = z.infer<typeof CreateSubmissionSchema>;

export const RegisterMediaSchema = z.object({
  kind: MediaKindSchema,
  store: MediaStoreSchema,
  storeKey: z.string().min(1),
  originalFileName: UploadFileNameSchema,
  sizeBytes: z.number().int().positive(),
  mimeType: MediaMimeTypeSchema,
});
export type RegisterMedia = z.infer<typeof RegisterMediaSchema>;

export const RecordEventSchema = z.object({
  kind: EventKindSchema,
  entityId: IdSchema.optional(),
  meta: z.record(z.string(), z.json()).optional(),
});
export type RecordEvent = z.infer<typeof RecordEventSchema>;

/** What "Send feedback" is checked against beyond its shape. */
export interface SendFeedbackLimits {
  durationSec: number;
  libraryItemIds: ReadonlySet<string>;
}

export function sendFeedbackSchemaFor(limits: SendFeedbackLimits) {
  return SendFeedbackSchema.superRefine((feedback, ctx) => {
    if (feedback.comments.some((comment) => comment.tSeconds > limits.durationSec)) {
      ctx.addIssue({
        code: "custom",
        message: "A comment is past the end of the take.",
        path: ["comments"],
      });
    }
    if (feedback.assignLibraryItemIds.some((id) => !limits.libraryItemIds.has(id))) {
      ctx.addIssue({
        code: "custom",
        message: "An assigned exercise is not in the library.",
        path: ["assignLibraryItemIds"],
      });
    }
  });
}

export function reviewActionSchemaFor(limits: SendFeedbackLimits) {
  return z.discriminatedUnion("intent", [ReplyUploadSchema, sendFeedbackSchemaFor(limits)]);
}
