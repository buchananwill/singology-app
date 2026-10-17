import { Box, Button, Card, Stack, Text, Textarea, Title } from "@mantine/core";
import { href, Link } from "react-router";

import { formatCount } from "../../lib/format";
import { useHydrated } from "../../lib/useHydrated";
import { SuccessState } from "../SuccessState";
import type { ReviewSession } from "./useReviewSession";

export interface SendFeedbackCardProps {
  session: ReviewSession;
  studentFirstName: string;
}

export function SendFeedbackCard({ session, studentFirstName }: SendFeedbackCardProps) {
  const { review, dispatch, reply, sendState, send } = session;
  const hydrated = useHydrated();
  return (
    <Card withBorder padding="lg" data-testid="send-feedback">
      <Stack gap="md">
        <Title order={2} size="h3">
          Send feedback
        </Title>
        {sendState.status === "sent" ? (
          <SuccessState title="Sent" message={sendState.message} testId="send-success">
            <Button component={Link} to={href("/coach")} variant="light">
              Back to the queue
            </Button>
          </SuccessState>
        ) : (
          <>
            <Textarea
              label={`Summary for ${studentFirstName} (optional)`}
              value={review.summary}
              onChange={(event) =>
                dispatch({ type: "setSummary", summary: event.currentTarget.value })
              }
              maxLength={2000}
              autosize
              minRows={3}
            />
            <Text size="sm" c="dimmed" data-testid="send-summary">
              {formatCount(review.comments.length, "comment", "comments")} ·{" "}
              {reply === null ? "no reply" : "reply attached"} ·{" "}
              {formatCount(review.assigned.length, "exercise", "exercises")} to assign
            </Text>
            {sendState.status === "failed" && (
              <Text size="sm" c="red" role="alert">
                {sendState.error}
              </Text>
            )}
            <Box>
              <Button onClick={send} disabled={!hydrated} loading={sendState.status === "sending"}>
                Send feedback
              </Button>
            </Box>
          </>
        )}
      </Stack>
    </Card>
  );
}
