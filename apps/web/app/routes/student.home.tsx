import { Anchor, Badge, Button, Card, Container, Group, Stack, Text, Title } from "@mantine/core";
import type { Assignment, LibraryItem } from "@singology/shared";
import { data, Link } from "react-router";

import { repositoriesContext, studentIdContext } from "../context";
import {
  ASSIGNMENT_STATUS_COLOR,
  ASSIGNMENT_STATUS_LABEL,
  CATEGORY_LABEL,
  formatDate,
  formatTurnaround,
} from "../lib/format";
import type { Route } from "./+types/student.home";

export const meta: Route.MetaFunction = () => [{ title: "This week | Singology" }];

/** "This week" shows the most recent assignments, up to this many. */
const THIS_WEEK_LIMIT = 4;

interface ThisWeekRow {
  assignment: Assignment;
  item: LibraryItem;
  submissionId: string | undefined;
}

export async function loader({ context }: Route.LoaderArgs) {
  const repositories = context.get(repositoriesContext);
  const studentId = context.get(studentIdContext);
  const [student, enrolments, assignments, submissions, feedback] = await Promise.all([
    repositories.students.get(studentId),
    repositories.enrolments.forStudent(studentId),
    repositories.assignments.forStudent(studentId),
    repositories.submissions.forStudent(studentId),
    repositories.feedback.forStudent(studentId),
  ]);
  const enrolment = enrolments.find((e) => e.status === "active");
  const coach = enrolment ? await repositories.coaches.get(enrolment.coachId) : undefined;
  if (!student || !coach) {
    throw data("The demo student has no active coach", { status: 404 });
  }

  const recent = [...assignments]
    .sort((a, b) => b.assignedAt.localeCompare(a.assignedAt))
    .slice(0, THIS_WEEK_LIMIT);
  const [latest] = feedback;
  const latestSubmission = submissions.find((s) => s.id === latest?.submissionId);
  const [recentItems, latestItem, latestComments] = await Promise.all([
    repositories.library.getMany(recent.map((assignment) => assignment.libraryItemId)),
    latestSubmission ? repositories.library.get(latestSubmission.libraryItemId) : undefined,
    latest ? repositories.feedback.comments(latest.id) : [],
  ]);
  const itemById = new Map(recentItems.map((item) => [item.id, item]));

  return {
    firstName: student.displayName.split(" ")[0] ?? student.displayName,
    coach: { name: coach.displayName, turnaroundHours: coach.turnaroundHours },
    thisWeek: recent
      .map((assignment) => ({
        assignment,
        item: itemById.get(assignment.libraryItemId),
        submissionId: submissions.find((s) => s.assignmentId === assignment.id)?.id,
      }))
      .filter((row): row is ThisWeekRow => row.item !== undefined),
    latestFeedback:
      latest && latestSubmission && latestItem
        ? {
            submissionId: latestSubmission.id,
            exerciseTitle: latestItem.title,
            body: latest.body,
            sentAt: latest.sentAt,
            commentCount: latestComments.length,
          }
        : null,
  };
}

export default function StudentHome({ loaderData }: Route.ComponentProps) {
  const { firstName, coach, thisWeek, latestFeedback } = loaderData;
  return (
    <Container size="md">
      <Stack gap="lg">
        <div>
          <Title order={1}>This week</Title>
          <Text c="dimmed">
            Hello {firstName}. {coach.name} replies within {formatTurnaround(coach.turnaroundHours)}{" "}
            of your upload.
          </Text>
        </div>

        <Stack component="section" gap="sm" aria-labelledby="assigned-title">
          <Title id="assigned-title" order={2} size="h3">
            Your exercises
          </Title>
          {thisWeek.map(({ assignment, item, submissionId }) => (
            <Card key={assignment.id} withBorder padding="md" data-testid="assignment">
              <Group justify="space-between" wrap="nowrap" align="flex-start">
                <Stack gap={4}>
                  <Anchor component={Link} to={`/student/exercises/${item.id}`} fw={600}>
                    {item.title}
                  </Anchor>
                  <Text size="sm" c="dimmed">
                    {CATEGORY_LABEL[item.category]} · set {formatDate(assignment.assignedAt)}
                  </Text>
                  {assignment.status === "feedback_ready" && submissionId !== undefined && (
                    <Anchor component={Link} to={`/student/submissions/${submissionId}`} size="sm">
                      Read the feedback
                    </Anchor>
                  )}
                </Stack>
                <Badge
                  color={ASSIGNMENT_STATUS_COLOR[assignment.status]}
                  variant="light"
                  style={{ flexShrink: 0 }}
                >
                  {ASSIGNMENT_STATUS_LABEL[assignment.status]}
                </Badge>
              </Group>
            </Card>
          ))}
        </Stack>

        {latestFeedback !== null && (
          <Stack component="section" gap="sm" aria-labelledby="latest-title">
            <Title id="latest-title" order={2} size="h3">
              Latest feedback
            </Title>
            <Card withBorder padding="md" data-testid="latest-feedback">
              <Stack gap="xs">
                <Text fw={600}>{latestFeedback.exerciseTitle}</Text>
                <Text size="sm" c="dimmed">
                  From {coach.name} on {formatDate(latestFeedback.sentAt)} ·{" "}
                  {latestFeedback.commentCount} timestamped comments
                </Text>
                <Text size="sm" lineClamp={3}>
                  {latestFeedback.body}
                </Text>
                <Group>
                  <Button
                    component={Link}
                    to={`/student/submissions/${latestFeedback.submissionId}`}
                    size="sm"
                  >
                    Listen with comments
                  </Button>
                </Group>
              </Stack>
            </Card>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
