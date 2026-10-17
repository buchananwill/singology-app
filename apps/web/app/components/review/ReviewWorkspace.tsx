import { Container, Stack } from "@mantine/core";
import type { ReviewMode } from "@singology/shared";

import { ReviewedView, type ReviewedViewProps } from "./ReviewedView";
import { ReviewForm, type ReviewFormData } from "./ReviewForm";
import { ReviewHeader, type ReviewHeaderProps } from "./ReviewHeader";
import { useReviewSession } from "./useReviewSession";

export type ReviewingFace = { mode: Extract<ReviewMode, "reviewing"> } & ReviewFormData;
export type ReviewedFace = { mode: Extract<ReviewMode, "reviewed"> } & ReviewedViewProps;
export type ReviewWorkspaceProps = ReviewHeaderProps & (ReviewingFace | ReviewedFace);

function Reviewing(props: Extract<ReviewWorkspaceProps, { mode: "reviewing" }>) {
  const session = useReviewSession(props.submission.id);
  return (
    <>
      <ReviewHeader {...props} sent={session.sent} />
      <ReviewForm {...props} session={session} />
    </>
  );
}

export function ReviewWorkspace(props: ReviewWorkspaceProps) {
  return (
    <Container size="lg">
      <Stack gap="lg">
        {props.mode === "reviewed" ? (
          <>
            <ReviewHeader {...props} sent />
            <ReviewedView {...props} />
          </>
        ) : (
          <Reviewing {...props} />
        )}
      </Stack>
    </Container>
  );
}
