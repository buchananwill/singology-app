import type { FeedbackComment } from "@singology/shared";

/** A sent comment or a coach's unsent draft: the player needs only its time and text. */
export type PlayerComment = Pick<FeedbackComment, "id" | "tSeconds" | "body">;
