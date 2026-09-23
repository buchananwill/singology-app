import {
  AssignmentSchema,
  CoachOfferSchema,
  CoachSchema,
  EnrolmentSchema,
  FeedbackCommentSchema,
  FeedbackSchema,
  LibraryItemSchema,
  MediaAssetSchema,
  StudentSchema,
  SubmissionSchema,
} from "@singology/shared";
import { describe, expect, it } from "vitest";

import { createFixtureRepositories } from "./createFixtureRepositories";
import { fixtureData } from "./data";

describe("fixture data", () => {
  it("parses against the shared Zod schemas", () => {
    expect(() => {
      CoachSchema.array().parse(fixtureData.coaches);
      CoachOfferSchema.array().parse(fixtureData.coachOffers);
      StudentSchema.array().parse(fixtureData.students);
      EnrolmentSchema.array().parse(fixtureData.enrolments);
      LibraryItemSchema.array().parse(fixtureData.libraryItems);
      MediaAssetSchema.array().parse(fixtureData.mediaAssets);
      AssignmentSchema.array().parse(fixtureData.assignments);
      SubmissionSchema.array().parse(fixtureData.submissions);
      FeedbackSchema.array().parse(fixtureData.feedback);
      FeedbackCommentSchema.array().parse(fixtureData.feedbackComments);
    }).not.toThrow();
  });

  it("references only existing media from library items", () => {
    const mediaIds = new Set(fixtureData.mediaAssets.map((m) => m.id));
    for (const item of fixtureData.libraryItems) {
      expect(mediaIds).toContain(item.demoMediaId);
    }
  });
});

describe("createFixtureRepositories", () => {
  it("lists coaches", async () => {
    const repos = createFixtureRepositories();
    const coaches = await repos.coaches.list();
    expect(coaches.map((c) => c.displayName)).toContain("Singology founder");
  });

  it("returns copies that cannot mutate the fixtures", async () => {
    const repos = createFixtureRepositories();
    const [coach] = await repos.coaches.list();
    expect(coach).toBeDefined();
    if (coach) {
      coach.displayName = "Mutated";
    }
    const [again] = await repos.coaches.list();
    expect(again?.displayName).toBe("Singology founder");
  });
});
