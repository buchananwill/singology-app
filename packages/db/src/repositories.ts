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
}

export interface FeedbackRepository {
  forSubmission(submissionId: string): Promise<Feedback | undefined>;
  comments(feedbackId: string): Promise<FeedbackComment[]>;
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
