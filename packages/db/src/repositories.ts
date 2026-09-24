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

export interface CoachWithOffers {
  coach: Coach;
  offers: CoachOffer[];
}

export interface CoachRepository {
  listWithOffers(): Promise<CoachWithOffers[]>;
  get(id: string): Promise<Coach | undefined>;
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
}

export interface MediaRepository {
  get(id: string): Promise<MediaAsset | undefined>;
  getMany(ids: readonly string[]): Promise<MediaAsset[]>;
}

export interface AssignmentRepository {
  forStudent(studentId: string): Promise<Assignment[]>;
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

export interface SubmissionRepository {
  /** The submission, when it belongs to this student; otherwise `undefined`. */
  getForStudent(studentId: string, submissionId: string): Promise<OwnedSubmission | undefined>;
  /** The submission, when it belongs to one of this coach's students; otherwise `undefined`. */
  getForCoach(coachId: string, submissionId: string): Promise<OwnedSubmission | undefined>;
  forStudent(studentId: string): Promise<Submission[]>;
  queueViewForCoach(coachId: string): Promise<CoachQueueItem[]>;
  /** The same student's most recent earlier submission of the same exercise. */
  previousFor(submissionId: string): Promise<Submission | undefined>;
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
}

/** `now` is the request time, which the fixture repositories resolve their time offsets against. */
export interface RepositoryOptions {
  now: Date;
}

/** The data seam: fixtures in the facade, Drizzle in the slice. */
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
