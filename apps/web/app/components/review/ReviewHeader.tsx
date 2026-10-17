import { Anchor, Badge, Group, Stack, Text, Title } from "@mantine/core";
import type { Coach, LibraryItem, Student, Submission } from "@singology/shared";
import { href, Link } from "react-router";

import { CATEGORY_LABEL, formatDate } from "../../lib/format";
import { SubmittedAgo } from "./SubmittedAgo";

export interface ReviewHeaderProps {
  now: number;
  turnaroundHours: Coach["turnaroundHours"];
  submission: Submission;
  student: Student;
  item: LibraryItem;
}

export interface ReviewHeaderState {
  /** A sent review has no deadline left to count. */
  sent: boolean;
}

export function ReviewHeader({
  now,
  turnaroundHours,
  submission,
  student,
  item,
  sent,
}: ReviewHeaderProps & ReviewHeaderState) {
  return (
    <Stack gap={0} align="flex-start">
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
    </Stack>
  );
}
