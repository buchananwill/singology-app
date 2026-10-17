import { Anchor, Badge, Container, Group, Stack, Text, Title } from "@mantine/core";
import type { LibraryItem, ReviewMode, Student, Submission } from "@singology/shared";
import { href, Link } from "react-router";

import { CATEGORY_LABEL, formatDate } from "../../lib/format";
import { ReviewedView, type ReviewedViewProps } from "./ReviewedView";
import { ReviewForm, type ReviewFormProps } from "./ReviewForm";
import { SubmittedAgo } from "./SubmittedAgo";

interface ReviewHeaderProps {
  now: number;
  turnaroundHours: number;
  submission: Submission;
  student: Student;
  item: LibraryItem;
}

export type ReviewWorkspaceProps = ReviewHeaderProps &
  (
    | ({ mode: Extract<ReviewMode, "reviewing"> } & ReviewFormProps)
    | ({ mode: Extract<ReviewMode, "reviewed"> } & ReviewedViewProps)
  );

function ReviewHeader({ now, turnaroundHours, submission, student, item }: ReviewHeaderProps) {
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
      <Text size="sm" c="dimmed">
        Submitted {formatDate(submission.submittedAt)} (
        <SubmittedAgo
          serverNow={now}
          submittedAt={submission.submittedAt}
          turnaroundHours={turnaroundHours}
        />
        )
      </Text>
    </div>
  );
}

/** A review still being written, or the read-only feedback once it is sent. */
export function ReviewWorkspace(props: ReviewWorkspaceProps) {
  return (
    <Container size="lg">
      <Stack gap="lg">
        <ReviewHeader {...props} />
        {props.mode === "reviewed" ? <ReviewedView {...props} /> : <ReviewForm {...props} />}
      </Stack>
    </Container>
  );
}
