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

/**
 * Placeholder fixture set for the scaffold stage. The full cast
 * (spec decision 17) replaces it later.
 */
export const fixtureData: FixtureData = {
  coaches: [
    {
      id: "coach-founder",
      displayName: "Singology founder",
      tier: "premium",
      bio: "Placeholder bio for the founding coach.",
      avatarSrc: "/avatars/coach-founder.svg",
      turnaroundHours: 72,
    },
  ],
  coachOffers: [],
  students: [
    {
      id: "student-ada",
      displayName: "Ada Placeholder",
      voiceType: "mezzo",
    },
  ],
  enrolments: [],
  libraryItems: [
    {
      id: "lib-breath-hiss",
      title: "Sustained hiss",
      category: "breath",
      voiceTypes: ["soprano", "mezzo", "alto", "tenor", "baritone", "bass"],
      instructions: "Placeholder instructions.",
      demoMediaId: "media-test-pattern",
      backingTrackMediaId: "media-backing-track",
    },
  ],
  mediaAssets,
  assignments: [],
  submissions: [],
  feedback: [],
  feedbackComments: [],
};
