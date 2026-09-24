import { Box, Button, Card, Stack, Text, Textarea, Title } from "@mantine/core";
import type { RecordingUpload, SendFeedback } from "@singology/shared";
import type { Dispatch } from "react";
import { href, Link, useFetcher } from "react-router";

import type { MessageResult } from "../../lib/actionResult";
import { formatCount } from "../../lib/format";
import { useActionNotification } from "../../lib/useActionNotification";
import { useHydrated } from "../../lib/useHydrated";
import { SuccessState } from "../SuccessState";
import type { ReviewEvent, ReviewState } from "./reviewReducer";

export interface SendFeedbackCardProps {
  review: ReviewState;
  dispatch: Dispatch<ReviewEvent>;
  /** The attached reply's metadata, or `null` when there is none. */
  reply: RecordingUpload | null;
  studentFirstName: string;
}

/**
 * The written summary and "Send feedback" (decision 16). Posts the whole
 * review as JSON to the route action, which validates it and saves nothing
 * (decision 11), then shows a notification and a success state.
 */
export function SendFeedbackCard({
  review,
  dispatch,
  reply,
  studentFirstName,
}: SendFeedbackCardProps) {
  const hydrated = useHydrated();
  const fetcher = useFetcher<MessageResult>();
  const result = useActionNotification(fetcher, "Feedback sent");
  const sent = result?.ok === true;

  function onSend() {
    // Typed as the parsed shape: JSON-safe (the schema's input type has `unknown` coerced numbers).
    const payload: SendFeedback = {
      intent: "send",
      summary: review.summary,
      comments: review.comments.map(({ tSeconds, body }) => ({ tSeconds, body })),
      reply,
      assignLibraryItemIds: [...review.assigned],
    };
    void fetcher.submit(payload, { method: "post", encType: "application/json" });
  }

  return (
    <Card withBorder padding="lg" data-testid="send-feedback">
      <Stack gap="md">
        <Title order={2} size="h3">
          Send feedback
        </Title>
        {sent ? (
          <SuccessState title="Feedback sent" message={result.message} testId="send-success">
            <Button component={Link} to={href("/coach")} variant="light">
              Back to the review queue
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
            {result?.ok === false && (
              <Text size="sm" c="red" role="alert">
                {result.error}
              </Text>
            )}
            <Box>
              <Button onClick={onSend} disabled={!hydrated} loading={fetcher.state !== "idle"}>
                Send feedback
              </Button>
            </Box>
          </>
        )}
      </Stack>
    </Card>
  );
}
