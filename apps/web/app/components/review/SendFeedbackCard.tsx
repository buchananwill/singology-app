import { Alert, Box, Button, Card, Stack, Text, Textarea, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import type { RecordingUpload, SendFeedback } from "@singology/shared";
import { type Dispatch, useEffect } from "react";
import { Link, useFetcher } from "react-router";

import type { ActionResult } from "../../lib/actionResult";
import { useHydrated } from "../../lib/useHydrated";
import type { ReviewEvent, ReviewState } from "./reviewReducer";

export interface SendFeedbackCardProps {
  review: ReviewState;
  dispatch: Dispatch<ReviewEvent>;
  /** The attached reply's metadata, or `null` when there is none. */
  reply: RecordingUpload | null;
  studentFirstName: string;
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
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
  const fetcher = useFetcher<ActionResult<{ message: string }>>();
  const result = fetcher.state === "idle" ? fetcher.data : undefined;
  const sent = result?.ok === true;

  useEffect(() => {
    if (fetcher.data?.ok === true) {
      notifications.show({ color: "green", title: "Feedback sent", message: fetcher.data.message });
    }
  }, [fetcher.data]);

  function onSend() {
    // Typed as the parsed shape: JSON-safe (the schema's input type has `unknown` coerced numbers).
    const payload: SendFeedback = {
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
          <Stack gap="sm">
            <Alert color="green" title="Feedback sent" data-testid="send-success">
              {result.message}
            </Alert>
            <Box>
              <Button component={Link} to="/coach" variant="light">
                Back to the review queue
              </Button>
            </Box>
          </Stack>
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
              {plural(review.comments.length, "comment", "comments")} ·{" "}
              {reply === null ? "no reply" : "reply attached"} ·{" "}
              {plural(review.assigned.length, "exercise", "exercises")} to assign
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
