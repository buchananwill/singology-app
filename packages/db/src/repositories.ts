import type {
  Assignment,
  Coach,
  CoachOffer,
  Collection,
  CreateSubmission,
  Enrolment,
  Feedback,
  FeedbackComment,
  LibraryFilter,
  LibraryItem,
  MediaAsset,
  MediaKind,
  Me,
  RecordEvent,
  RegisterMedia,
  SendFeedbackInput,
  Student,
  Submission,
} from "@singology/shared";

export interface CoachWithOffers {
  coach: Coach;
  offers: CoachOffer[];
}

export interface CoachRepository {
  listWithOffers(): Promise<CoachWithOffers[]>;
  get(id: string): Promise<Coach | undefined>;
}

export interface MeRepository {
  /** `null` when the caller is anonymous or has no profile row. */
  get(): Promise<Me | null>;
}

export interface StudentRepository {
  get(id: string): Promise<Student | undefined>;
}

export interface EnrolmentRepository {
  forStudent(studentId: string): Promise<Enrolment[]>;
}

export interface LibraryRepository {
  list(filter?: LibraryFilter): Promise<LibraryItem[]>;
  get(id: string): Promise<LibraryItem | undefined>;
  /** The items with these ids, in the order given; unknown ids are omitted. */
  getMany(ids: readonly string[]): Promise<LibraryItem[]>;
  /** In collection order, each with its items in order. */
  listCollections(): Promise<Collection[]>;
}

export interface MediaRepository {
  get(id: string): Promise<MediaAsset | undefined>;
  getMany(ids: readonly string[]): Promise<MediaAsset[]>;
  /** Registers the caller's upload as `pending`; only the media job makes it ready. */
  register(input: RegisterMedia): Promise<Pick<MediaAsset, "id">>;
}

export interface EventRepository {
  record(input: RecordEvent): Promise<void>;
}

export interface AssignmentRepository {
  forStudent(studentId: string): Promise<Assignment[]>;
  /** The exercises one review assigned, oldest first. */
  forFeedback(feedbackId: string): Promise<Assignment[]>;
}

export interface OwnedSubmission {
  submission: Submission;
  enrolment: Enrolment;
}

export interface CoachQueueItem {
  submission: Submission;
  student: Student;
  item: LibraryItem;
  mediaKind: MediaKind;
}

export type ReviewedQueueItem = CoachQueueItem & Pick<Feedback, "sentAt">;

export interface SubmissionRepository {
  /** The submission, when it belongs to this student; otherwise `undefined`. */
  getForStudent(studentId: string, submissionId: string): Promise<OwnedSubmission | undefined>;
  /** The submission, when it belongs to one of this coach's students; otherwise `undefined`. */
  getForCoach(coachId: string, submissionId: string): Promise<OwnedSubmission | undefined>;
  forStudent(studentId: string): Promise<Submission[]>;
  queueViewForCoach(coachId: string): Promise<CoachQueueItem[]>;
  /** Most recently sent first, at most `limit`. */
  recentlyReviewedForCoach(coachId: string, limit: number): Promise<ReviewedQueueItem[]>;
  /** The same student's most recent earlier submission of the same exercise. */
  previousFor(submissionId: string): Promise<Submission | undefined>;
  /** Creates the take as `processing`; an assigned take must be of the assignment's exercise. */
  create(input: CreateSubmission): Promise<Submission>;
}

/** The comments are in time order. */
export interface FeedbackWithComments {
  feedback: Feedback;
  comments: FeedbackComment[];
}

export interface FeedbackRepository {
  forSubmissionWithComments(submissionId: string): Promise<FeedbackWithComments | undefined>;
  /** Every feedback item on this student's submissions, newest first. */
  forStudent(studentId: string): Promise<Feedback[]>;
  comments(feedbackId: string): Promise<FeedbackComment[]>;
  /**
   * Persists the whole review at once: the feedback, its comments, the submission's `reviewed`
   * status and one assignment per assigned exercise. Nothing is kept if any part fails.
   */
  send(input: SendFeedbackInput): Promise<FeedbackWithComments>;
}

/** `now` is the request time, which the fixture repositories resolve their time offsets against. */
export interface RepositoryOptions {
  now: Date;
}

/** The data seam: fixtures in the facade, Drizzle in the slice. */
export interface Repositories {
  me: MeRepository;
  coaches: CoachRepository;
  students: StudentRepository;
  enrolments: EnrolmentRepository;
  library: LibraryRepository;
  media: MediaRepository;
  assignments: AssignmentRepository;
  submissions: SubmissionRepository;
  feedback: FeedbackRepository;
  events: EventRepository;
}
