import { List, Text, UnstyledButton } from "@mantine/core";
import type { FeedbackComment } from "@singology/shared";

import { formatTimestamp } from "../../lib/format";
import { FULL_WIDTH_LIST_ITEMS } from "../fullWidthListItems";
import { usePlayer } from "./PlayerProvider";

export interface CommentListProps {
  comments: readonly FeedbackComment[];
}

/** Render inside the same `PlayerProvider`. */
export function CommentList({ comments }: CommentListProps) {
  const { handle } = usePlayer();
  return (
    <List type="ordered" listStyleType="none" spacing="xxs" styles={FULL_WIDTH_LIST_ITEMS}>
      {comments.map((comment, index) => (
        <List.Item key={comment.id}>
          <UnstyledButton
            onClick={() => handle.seek(comment.tSeconds)}
            data-testid="comment-item"
            w="100%"
            p="xs"
            style={{ borderRadius: "var(--mantine-radius-sm)" }}
          >
            <Text size="sm">
              <Text span fw={700} c="orange.8">
                {index + 1}
              </Text>{" "}
              <Text span ff="monospace" c="dimmed">
                {formatTimestamp(comment.tSeconds)}
              </Text>{" "}
              {comment.body}
            </Text>
          </UnstyledButton>
        </List.Item>
      ))}
    </List>
  );
}
