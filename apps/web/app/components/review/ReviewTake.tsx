import { Stack, Text, Title } from "@mantine/core";
import type { MediaAsset } from "@singology/shared";
import type { ReactNode } from "react";

import { CommentList } from "../player/CommentList";
import { StandalonePlayer } from "../player/StandalonePlayer";
import type { PlayerComment } from "../player/types";

export interface ReviewTakeProps {
  take: MediaAsset;
  studentName: string;
  comments: readonly PlayerComment[];
  /** Shown in place of the list when there are no comments. */
  emptyText: string;
  /** Rendered inside the player, above the comments. */
  children?: ReactNode;
}

export function ReviewTake({ take, studentName, comments, emptyText, children }: ReviewTakeProps) {
  return (
    <Stack component="section" gap="sm" aria-labelledby="take-title" data-testid="review-take">
      <Title id="take-title" order={2} size="h3">
        The take
      </Title>
      <StandalonePlayer asset={take} comments={comments} label={`${studentName}'s take`}>
        {children}
        <Title order={3} size="h4">
          Comments ({comments.length})
        </Title>
        {comments.length > 0 ? (
          <CommentList comments={comments} />
        ) : (
          <Text size="sm" c="dimmed">
            {emptyText}
          </Text>
        )}
      </StandalonePlayer>
    </Stack>
  );
}
