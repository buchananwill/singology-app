import { Anchor, Badge, Container, Group, Stack, Text, Title } from "@mantine/core";
import type { Coach, LibraryItem, ReviewMode, Student, Submission } from "@singology/shared";
import { href, Link } from "react-router";

import { CATEGORY_LABEL, formatDate } from "../../lib/format";
import { ReviewedView, type ReviewedViewProps } from "./ReviewedView";
import { ReviewForm, type ReviewFormData } from "./ReviewForm";
import { SubmittedAgo } from "./SubmittedAgo";
import { useReviewSession } from "./useReviewSession";

export interface ReviewHeaderProps {
  now: number;
  turnaroundHours: Coach["turnaroundHours"];
  submission: Submission;
  student: Student;
  item: LibraryItem;
}

export type ReviewingFace = { mode: Extract<ReviewMode, "reviewing"> } & ReviewFormData;
export type ReviewedFace = { mode: Extract<ReviewMode, "reviewed"> } & ReviewedViewProps;
export type ReviewWorkspaceProps = ReviewHeaderProps & (ReviewingFace | ReviewedFace);

interface ReviewHeaderState {
  /** A sent review has no deadline left to count. */
  sent: boolean;
}

function ReviewHeader({
  now,
  turnaroundHours,
  submission,
  student,
  item,
  sent,
}: ReviewHeaderProps & ReviewHeaderState) {
  return (
    <div>
      <Anchor component={Link} to={href("/coach")} size="sm">
        ← Review queue
      </Anchor>
      <Title order={1}>Review: {student.displayName}</Title>
      <Group gap="xs">
        <Text c="dimmed">{item.title}</Text>
        <Badge variant="light">{CATEGORY_LABEL[item.category]}</Badge>
      </Group>
      <Text size="sm" c="dimmed" data-testid="review-submitted">
        Submitted {formatDate(submission.submittedAt)}
        {!sent && (
          <>
            {" "}
            (
            <SubmittedAgo
              serverNow={now}
              submittedAt={submission.submittedAt}
              turnaroundHours={turnaroundHours}
            />
            )
          </>
        )}
      </Text>
    </div>
  );
}

function Reviewing(props: ReviewHeaderProps & ReviewingFace) {
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
