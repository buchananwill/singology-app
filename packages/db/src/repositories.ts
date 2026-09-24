import type {
  Assignment,
  Coach,
  CoachOffer,
  Enrolment,
  Feedback,
  FeedbackComment,
  LibraryFilter,
  LibraryItem,
  MediaAsset,
  MediaKind,
  Student,
  Submission,
} from "@singology/shared";

/** A coach with every offer they sell. */
export interface CoachWithOffers {
  coach: Coach;
  offers: CoachOffer[];
}

export interface CoachRepository {
  list(): Promise<Coach[]>;
  listWithOffers(): Promise<CoachWithOffers[]>;
  get(id: string): Promise<Coach | undefined>;
  offers(coachId: string): Promise<CoachOffer[]>;
}

export interface StudentRepository {
  get(id: string): Promise<Student | undefined>;
}

export interface EnrolmentRepository {
  get(id: string): Promise<Enrolment | undefined>;
  forStudent(studentId: string): Promise<Enrolment[]>;
}

export interface LibraryRepository {
  list(filter?: LibraryFilter): Promise<LibraryItem[]>;
  get(id: string): Promise<LibraryItem | undefined>;
  /** The items with these ids, in the order given; unknown ids are omitted. */
  getMany(ids: readonly string[]): Promise<LibraryItem[]>;
}

export interface MediaRepository {
  get(id: string): Promise<MediaAsset | undefined>;
  /** The assets with these ids, in the order given; unknown ids are omitted. */
  getMany(ids: readonly string[]): Promise<MediaAsset[]>;
}

export interface AssignmentRepository {
  forStudent(studentId: string): Promise<Assignment[]>;
}

/** A submission together with the enrolment that owns it. */
export interface OwnedSubmission {
  submission: Submission;
  enrolment: Enrolment;
}

/** One row of a coach's review queue. */
export interface CoachQueueItem {
  submission: Submission;
  student: Student;
  item: LibraryItem;
  mediaKind: MediaKind;
}

export interface SubmissionRepository {
  get(id: string): Promise<Submission | undefined>;
  /** The submission, when it belongs to this student; otherwise `undefined`. */
  getForStudent(studentId: string, submissionId: string): Promise<OwnedSubmission | undefined>;
  /** The submission, when it belongs to one of this coach's students; otherwise `undefined`. */
  getForCoach(coachId: string, submissionId: string): Promise<OwnedSubmission | undefined>;
  forStudent(studentId: string): Promise<Submission[]>;
  /** Submissions awaiting review for this coach, oldest first. */
  queueForCoach(coachId: string): Promise<Submission[]>;
  /** The same queue, each item joined with its student, exercise and media kind. */
  queueViewForCoach(coachId: string): Promise<CoachQueueItem[]>;
  /**
   * The same student's most recent earlier submission of the same exercise,
   * or `undefined` when this is their first take (or the id is unknown).
   */
  previousFor(submissionId: string): Promise<Submission | undefined>;
}

/** A feedback item with its timestamped comments, in time order. */
export interface FeedbackWithComments {
  feedback: Feedback;
  comments: FeedbackComment[];
}

export interface FeedbackRepository {
  forSubmission(submissionId: string): Promise<Feedback | undefined>;
  forSubmissionWithComments(submissionId: string): Promise<FeedbackWithComments | undefined>;
  /** Every feedback item on this student's submissions, newest first. */
  forStudent(studentId: string): Promise<Feedback[]>;
  comments(feedbackId: string): Promise<FeedbackComment[]>;
}

/**
 * What every repository factory takes. `now` is the request time: the fixture
 * repositories resolve their time offsets against it (journal decision 32);
 * the slice's Drizzle repositories take the same shape and ignore it.
 */
export interface RepositoryOptions {
  now: Date;
}

/**
 * The data seam. The facade implements it over fixtures; the slice adds a
 * Drizzle implementation behind the same interface.
 */
export interface Repositories {
  coaches: CoachRepository;
  students: StudentRepository;
  enrolments: EnrolmentRepository;
  library: LibraryRepository;
  media: MediaRepository;
  assignments: AssignmentRepository;
  submissions: SubmissionRepository;
  feedback: FeedbackRepository;
}
