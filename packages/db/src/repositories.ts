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
  Student,
  Submission,
} from "@singology/shared";

export interface CoachRepository {
  list(): Promise<Coach[]>;
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
}

export interface MediaRepository {
  get(id: string): Promise<MediaAsset | undefined>;
}

export interface AssignmentRepository {
  forStudent(studentId: string): Promise<Assignment[]>;
}

export interface SubmissionRepository {
  get(id: string): Promise<Submission | undefined>;
  forStudent(studentId: string): Promise<Submission[]>;
  /** Submissions awaiting review for this coach, oldest first. */
  queueForCoach(coachId: string): Promise<Submission[]>;
  /**
   * The same student's most recent earlier submission of the same exercise,
   * or `undefined` when this is their first take (or the id is unknown).
   */
  previousFor(submissionId: string): Promise<Submission | undefined>;
}

export interface FeedbackRepository {
  forSubmission(submissionId: string): Promise<Feedback | undefined>;
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
