import type {
  Assignment,
  Coach,
  CoachOffer,
  Enrolment,
  Feedback,
  FeedbackComment,
  LibraryItem,
  MediaAsset,
  Student,
  Submission,
} from "@singology/shared";

import { mediaAssets } from "./media";

/** Every fixture collection the fixture repositories read from. */
export interface FixtureData {
  coaches: Coach[];
  coachOffers: CoachOffer[];
  students: Student[];
  enrolments: Enrolment[];
  libraryItems: LibraryItem[];
  mediaAssets: MediaAsset[];
  assignments: Assignment[];
  submissions: Submission[];
  feedback: Feedback[];
  feedbackComments: FeedbackComment[];
}

/** The student the facade's student view shows (there is no sign-in). */
export const DEMO_STUDENT_ID = "student-ada";

/** The coach the facade's coach view shows: the founder. */
export const DEMO_COACH_ID = "coach-founder";

const ALL_VOICES: LibraryItem["voiceTypes"] = [
  "soprano",
  "mezzo",
  "alto",
  "tenor",
  "baritone",
  "bass",
];

const coaches: Coach[] = [
  {
    id: "coach-founder",
    displayName: "Singology founder",
    tier: "premium",
    bio: "Founded Singology after years of leading community choirs. Works on breath, easy onsets and a free top to the voice.",
    avatarSrc: "/avatars/coach-founder.svg",
    turnaroundHours: 72,
  },
  {
    id: "coach-standard",
    displayName: "Standard coach",
    tier: "standard",
    bio: "Trained by the founder in the Singology method. Friendly, practical feedback for choir singers at any level.",
    avatarSrc: "/avatars/coach-standard.svg",
    turnaroundHours: 72,
  },
];

/** Illustrative pricing (gtm-proposal pricing table): not a commitment. */
const coachOffers: CoachOffer[] = [
  {
    id: "offer-founder-monthly",
    coachId: "coach-founder",
    tier: "premium",
    name: "Monthly coaching",
    billing: "monthly",
    pricePence: 8000,
    submissionsPerPeriod: 4,
  },
  {
    id: "offer-founder-single",
    coachId: "coach-founder",
    tier: "premium",
    name: "Single review",
    billing: "single",
    pricePence: 2500,
    submissionsPerPeriod: 1,
  },
  {
    id: "offer-standard-monthly",
    coachId: "coach-standard",
    tier: "standard",
    name: "Monthly coaching",
    billing: "monthly",
    pricePence: 4500,
    submissionsPerPeriod: 4,
  },
  {
    id: "offer-standard-single",
    coachId: "coach-standard",
    tier: "standard",
    name: "Single review",
    billing: "single",
    pricePence: 1200,
    submissionsPerPeriod: 1,
  },
];

const students: Student[] = [
  { id: "student-ada", displayName: "Ada Example", voiceType: "mezzo" },
  { id: "student-ben", displayName: "Ben Sample", voiceType: "baritone" },
  { id: "student-cara", displayName: "Cara Placeholder", voiceType: "soprano" },
  { id: "student-dev", displayName: "Dev Demo", voiceType: "tenor" },
];

const enrolments: Enrolment[] = [
  {
    id: "enrol-ada",
    studentId: "student-ada",
    coachId: "coach-founder",
    offerId: "offer-founder-monthly",
    status: "active",
    currentPeriodEnd: "2026-10-05T00:00:00.000Z",
    submissionsUsed: 2,
  },
  {
    id: "enrol-ben",
    studentId: "student-ben",
    coachId: "coach-founder",
    offerId: "offer-founder-monthly",
    status: "active",
    currentPeriodEnd: "2026-10-12T00:00:00.000Z",
    submissionsUsed: 1,
  },
  {
    id: "enrol-cara",
    studentId: "student-cara",
    coachId: "coach-standard",
    offerId: "offer-standard-monthly",
    status: "active",
    currentPeriodEnd: "2026-10-01T00:00:00.000Z",
    submissionsUsed: 1,
  },
  {
    id: "enrol-dev",
    studentId: "student-dev",
    coachId: "coach-standard",
    offerId: "offer-standard-single",
    status: "active",
    currentPeriodEnd: "2026-10-20T00:00:00.000Z",
    submissionsUsed: 1,
  },
];

const libraryItems: LibraryItem[] = [
  {
    id: "lib-breath-hiss",
    title: "Sustained hiss",
    category: "breath",
    voiceTypes: ALL_VOICES,
    instructions:
      "Stand tall with soft knees. Breathe in low for four counts, then let the air out on a steady 'sss' for as long as is comfortable. Keep the ribs wide and the shoulders still. Rest, then repeat four times.",
    demoMediaId: "media-test-pattern",
    backingTrackMediaId: "media-backing-track",
  },
  {
    id: "lib-breath-lip-trill",
    title: "Lip trill on one breath",
    category: "breath",
    voiceTypes: ALL_VOICES,
    instructions:
      "Loosen the lips and blow through them so they buzz, like a motorboat. Add a gentle hum and slide up and down a comfortable five notes. If the lips stop, press lightly on your cheeks with two fingers.",
    demoMediaId: "media-coach-reply",
    backingTrackMediaId: "media-backing-track",
  },
  {
    id: "lib-onset-balanced",
    title: "Balanced onsets on 'ah'",
    category: "onset",
    voiceTypes: ALL_VOICES,
    instructions:
      "Sing short 'ah' notes on one pitch, starting each one cleanly: no breathy 'h' before it and no click in the throat. Think of the note starting as the breath starts. Five notes, rest, then move up a step.",
    demoMediaId: "media-test-pattern",
    backingTrackMediaId: "media-backing-track",
  },
  {
    id: "lib-onset-hum-to-vowel",
    title: "Hum into a vowel",
    category: "onset",
    voiceTypes: ["soprano", "mezzo", "alto"],
    instructions:
      "Start on a relaxed 'mm' hum, feel the buzz on the lips, then open into 'ah' without changing the pitch or pushing. Keep the sound as easy after the vowel as it was in the hum.",
    demoMediaId: "media-coach-reply",
  },
  {
    id: "lib-range-siren",
    title: "Siren slides",
    category: "range",
    voiceTypes: ALL_VOICES,
    instructions:
      "On an 'ng' (as in 'sing'), slide smoothly from the bottom of your voice to the top and back, like a siren. Stay light and quiet. Don't reach for the top notes: let the slide carry you there.",
    demoMediaId: "media-test-pattern",
    backingTrackMediaId: "media-backing-track",
  },
  {
    id: "lib-range-bridge",
    title: "Crossing the bridge",
    category: "range",
    voiceTypes: ["tenor", "baritone", "bass"],
    instructions:
      "Sing a five-note scale on 'oo' that starts just below the point where your voice usually flips. Keep the volume down and the jaw loose as you cross it. Move the start up a semitone each time.",
    demoMediaId: "media-coach-reply",
    backingTrackMediaId: "media-backing-track",
  },
  {
    id: "lib-agility-five-note",
    title: "Five-note runs",
    category: "agility",
    voiceTypes: ALL_VOICES,
    instructions:
      "Sing 1-2-3-4-5-4-3-2-1 on 'ah', slowly at first, keeping every note clear and even. When it feels easy, speed up a little. Accuracy first; speed comes later.",
    demoMediaId: "media-test-pattern",
    backingTrackMediaId: "media-backing-track",
  },
  {
    id: "lib-agility-arpeggio",
    title: "Triplet arpeggios",
    category: "agility",
    voiceTypes: ["soprano", "mezzo", "tenor"],
    instructions:
      "Sing a major arpeggio (1-3-5-8-5-3-1) in triplets on 'ee'. Keep a light, bouncy feel and let each note land without an 'h' between them.",
    demoMediaId: "media-coach-reply",
    backingTrackMediaId: "media-backing-track",
  },
];

const assignments: Assignment[] = [
  {
    id: "asg-ada-siren-1",
    enrolmentId: "enrol-ada",
    libraryItemId: "lib-range-siren",
    assignedAt: "2026-09-07T09:00:00.000Z",
    status: "feedback_ready",
  },
  {
    id: "asg-ada-siren-2",
    enrolmentId: "enrol-ada",
    libraryItemId: "lib-range-siren",
    assignedAt: "2026-09-14T09:00:00.000Z",
    status: "feedback_ready",
  },
  {
    id: "asg-ada-onset",
    enrolmentId: "enrol-ada",
    libraryItemId: "lib-onset-balanced",
    assignedAt: "2026-09-14T09:00:00.000Z",
    status: "submitted",
  },
  {
    id: "asg-ada-runs",
    enrolmentId: "enrol-ada",
    libraryItemId: "lib-agility-five-note",
    assignedAt: "2026-09-19T09:00:00.000Z",
    status: "todo",
  },
  {
    id: "asg-ada-hiss",
    enrolmentId: "enrol-ada",
    libraryItemId: "lib-breath-hiss",
    assignedAt: "2026-09-19T09:00:00.000Z",
    status: "todo",
  },
  {
    id: "asg-ben-hiss",
    enrolmentId: "enrol-ben",
    libraryItemId: "lib-breath-hiss",
    assignedAt: "2026-09-15T09:00:00.000Z",
    status: "submitted",
  },
  {
    id: "asg-cara-arpeggio",
    enrolmentId: "enrol-cara",
    libraryItemId: "lib-agility-arpeggio",
    assignedAt: "2026-09-10T09:00:00.000Z",
    status: "feedback_ready",
  },
  {
    id: "asg-dev-bridge",
    enrolmentId: "enrol-dev",
    libraryItemId: "lib-range-bridge",
    assignedAt: "2026-09-18T09:00:00.000Z",
    status: "submitted",
  },
];

const submissions: Submission[] = [
  {
    id: "sub-ada-siren-1",
    enrolmentId: "enrol-ada",
    assignmentId: "asg-ada-siren-1",
    libraryItemId: "lib-range-siren",
    mediaId: "media-student-take-a",
    note: "First go at the sirens. My voice cracks near the top.",
    submittedAt: "2026-09-08T19:30:00.000Z",
    status: "reviewed",
  },
  {
    id: "sub-ada-siren-2",
    enrolmentId: "enrol-ada",
    assignmentId: "asg-ada-siren-2",
    libraryItemId: "lib-range-siren",
    mediaId: "media-student-take-b",
    note: "Tried it quieter this time, as you said. Is the top better?",
    submittedAt: "2026-09-16T20:10:00.000Z",
    status: "reviewed",
  },
  {
    id: "sub-ada-onset",
    enrolmentId: "enrol-ada",
    assignmentId: "asg-ada-onset",
    libraryItemId: "lib-onset-balanced",
    mediaId: "media-test-pattern",
    note: "Filmed this one so you can see my jaw.",
    submittedAt: "2026-09-21T18:45:00.000Z",
    status: "awaiting_review",
  },
  {
    id: "sub-ben-hiss",
    enrolmentId: "enrol-ben",
    assignmentId: "asg-ben-hiss",
    libraryItemId: "lib-breath-hiss",
    mediaId: "media-student-take-a",
    note: "I run out of air at about 20 seconds.",
    submittedAt: "2026-09-20T08:15:00.000Z",
    status: "awaiting_review",
  },
  {
    id: "sub-cara-arpeggio",
    enrolmentId: "enrol-cara",
    assignmentId: "asg-cara-arpeggio",
    libraryItemId: "lib-agility-arpeggio",
    mediaId: "media-student-take-b",
    note: "The fast ones get muddy.",
    submittedAt: "2026-09-12T17:00:00.000Z",
    status: "reviewed",
  },
  {
    id: "sub-dev-bridge",
    enrolmentId: "enrol-dev",
    assignmentId: "asg-dev-bridge",
    libraryItemId: "lib-range-bridge",
    mediaId: "media-test-pattern",
    note: "Video of the bridge exercise. It flips every time.",
    submittedAt: "2026-09-22T12:30:00.000Z",
    status: "awaiting_review",
  },
];

const feedback: Feedback[] = [
  {
    id: "fb-ada-siren-1",
    submissionId: "sub-ada-siren-1",
    coachId: "coach-founder",
    body: "A good start. The crack at the top comes from pushing more air as you go up. Next time, sing the whole siren at half the volume and let the top be thin: that's fine for now.",
    sentAt: "2026-09-10T10:00:00.000Z",
  },
  {
    id: "fb-ada-siren-2",
    submissionId: "sub-ada-siren-2",
    coachId: "coach-founder",
    body: "Much better. The top is smoother and the crack has almost gone. Listen to my reply for how I'd shape the last slide, then move on to the five-note runs.",
    replyMediaId: "media-coach-reply",
    sentAt: "2026-09-18T09:30:00.000Z",
  },
  {
    id: "fb-cara-arpeggio",
    submissionId: "sub-cara-arpeggio",
    coachId: "coach-standard",
    body: "Lovely tone. The runs blur when you speed up because the breath stops moving. Slow them right down and keep the air flowing through every note.",
    replyMediaId: "media-coach-reply",
    sentAt: "2026-09-14T16:00:00.000Z",
  },
];

const feedbackComments: FeedbackComment[] = [
  { id: "fc-ada-1-1", feedbackId: "fb-ada-siren-1", tSeconds: 4.5, body: "Nice relaxed start on the 'ng'." },
  { id: "fc-ada-1-2", feedbackId: "fb-ada-siren-1", tSeconds: 21, body: "Here's the crack: you get louder just before it." },
  { id: "fc-ada-1-3", feedbackId: "fb-ada-siren-1", tSeconds: 38.5, body: "The slide down is smooth. Keep this feeling going up." },
  { id: "fc-ada-1-4", feedbackId: "fb-ada-siren-1", tSeconds: 63, body: "Jaw is tightening here. Let it hang." },
  { id: "fc-ada-2-1", feedbackId: "fb-ada-siren-2", tSeconds: 6, body: "Good: much quieter, exactly what I asked for." },
  { id: "fc-ada-2-2", feedbackId: "fb-ada-siren-2", tSeconds: 24, body: "The top is much smoother. Only a small wobble left." },
  { id: "fc-ada-2-3", feedbackId: "fb-ada-siren-2", tSeconds: 45.5, body: "Breath runs low here. Take a quick top-up before the next slide." },
  { id: "fc-ada-2-4", feedbackId: "fb-ada-siren-2", tSeconds: 58, body: "Lovely easy vibrato at the bottom." },
  { id: "fc-ada-2-5", feedbackId: "fb-ada-siren-2", tSeconds: 70, body: "Last slide: think up before you start it." },
  { id: "fc-cara-1", feedbackId: "fb-cara-arpeggio", tSeconds: 8, body: "Clear, bright tone at the start." },
  { id: "fc-cara-2", feedbackId: "fb-cara-arpeggio", tSeconds: 33, body: "The notes start to run together here." },
  { id: "fc-cara-3", feedbackId: "fb-cara-arpeggio", tSeconds: 55.5, body: "Breath has stopped moving: keep it flowing." },
];

/** The full facade cast (spec decision 17). Names are fictional; there are no real people here. */
export const fixtureData: FixtureData = {
  coaches,
  coachOffers,
  students,
  enrolments,
  libraryItems,
  mediaAssets,
  assignments,
  submissions,
  feedback,
  feedbackComments,
};
