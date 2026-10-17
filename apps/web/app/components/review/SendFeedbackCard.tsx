import { Box, Button, Card, Stack, Text, Textarea, Title } from "@mantine/core";
import type { SendFeedback } from "@singology/shared";
import { href, Link, useFetcher } from "react-router";

import { formatCount } from "../../lib/format";
import { useActionNotification } from "../../lib/useActionNotification";
import { useHydrated } from "../../lib/useHydrated";
import { SuccessState } from "../SuccessState";
import type { ReviewActionResult } from "./reviewFetchers";
import type { ReviewSession } from "./useReviewSession";

export interface SendFeedbackCardProps {
  session: ReviewSession;
  studentFirstName: string;
}

/** Posts the whole review as JSON to the route action, which persists it in one go. */
export function SendFeedbackCard({ session, studentFirstName }: SendFeedbackCardProps) {
  const { review, dispatch, reply, sent, keys } = session;
  const hydrated = useHydrated();
  const fetcher = useFetcher<ReviewActionResult>({ key: keys.send });
  const result = useActionNotification(fetcher, "Feedback sent");

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
        {sent && result?.ok === true ? (
          <SuccessState title="Sent" message={result.message} testId="send-success">
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
