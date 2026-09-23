import { Stack, Text, UnstyledButton } from "@mantine/core";
import type { FeedbackComment } from "@singology/shared";

import { formatTimestamp } from "../../lib/format";
import { usePlayer } from "./PlayerProvider";

/**
 * The coach's timestamped comments as a list under the waveform. Clicking one
 * seeks the nearest player there. Render inside the same `PlayerProvider`.
 */
export function CommentList({ comments }: { comments: readonly FeedbackComment[] }) {
  const { handle } = usePlayer();
  return (
    <Stack gap={4} component="ol" p={0} m={0} style={{ listStyle: "none" }}>
      {comments.map((comment, index) => (
        <li key={comment.id}>
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
        </li>
      ))}
    </Stack>
  );
}
