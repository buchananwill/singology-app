import {
  Alert,
  Anchor,
  Avatar,
  Card,
  Container,
  Group,
  List,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { data, href, Link } from "react-router";

import { CommentList } from "../components/player/CommentList";
import { StandalonePlayer } from "../components/player/StandalonePlayer";
import { repositoriesContext, studentIdContext } from "../context";
import { CATEGORY_LABEL, formatDate, MEDIA_KIND_LABEL } from "../lib/format";
import type { Route } from "./+types/student.submission";

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: `Feedback: ${loaderData?.item.title ?? "Submission"} | Singology` },
];

export async function loader({ context, params }: Route.LoaderArgs) {
  const repositories = context.get(repositoriesContext);
  const studentId = context.get(studentIdContext);
  const owned = await repositories.submissions.getForStudent(studentId, params.id);
  if (!owned) {
    throw data("Submission not found", { status: 404 });
  }
  const { submission, enrolment } = owned;
  const [take, item, coach, reviewed, assignments] = await Promise.all([
    repositories.media.get(submission.mediaId),
    repositories.library.get(submission.libraryItemId),
    repositories.coaches.get(enrolment.coachId),
    repositories.feedback.forSubmissionWithComments(submission.id),
    repositories.assignments.forStudent(studentId),
  ]);
  if (!take || !item || !coach) {
    throw data("Submission data not found", { status: 404 });
  }
  const feedback = reviewed?.feedback;
  const [reply, next] = await Promise.all([
    feedback?.replyMediaId ? repositories.media.get(feedback.replyMediaId) : undefined,
    repositories.library.getMany(
      assignments.filter((a) => a.status === "todo").map((a) => a.libraryItemId),
    ),
  ]);
  if (feedback) {
    // Every view is recorded: time to first view is read from the earliest row.
    await repositories.events.record({
      kind: "feedback_viewed",
      entityId: submission.id,
      meta: { feedbackId: feedback.id },
    });
  }
  return {
    submission,
    take,
    item,
    coach: { name: coach.displayName, avatarSrc: coach.avatarSrc },
    feedback: feedback ?? null,
    comments: reviewed?.comments ?? [],
    reply: reply ?? null,
    next: next.map(({ id, title }) => ({ id, title })),
  };
}

export default function StudentSubmission({ loaderData }: Route.ComponentProps) {
  const { submission, take, item, coach, feedback, comments, reply, next } = loaderData;
  return (
    <Container size="md">
      <Stack gap="lg">
        <div>
          <Text size="sm" c="dimmed">
            {CATEGORY_LABEL[item.category]} ·{" "}
            <Anchor component={Link} to={href("/student/exercises/:id", { id: item.id })} size="sm">
              {item.title}
            </Anchor>
          </Text>
          <Title order={1}>{feedback ? "Your feedback" : "Waiting for feedback"}</Title>
          <Text c="dimmed">Your take from {formatDate(submission.submittedAt)}</Text>
        </div>

        {submission.note !== "" && (
          <Text size="sm">
            <strong>Your note:</strong> {submission.note}
          </Text>
        )}

        <Stack
          component="section"
          gap="xs"
          aria-labelledby="take-title"
          data-testid="feedback-take"
        >
          <Title id="take-title" order={2} size="h3">
            Your recording
          </Title>
          {feedback && (
            <Text size="sm" c="dimmed">
              Tap a numbered marker or a comment to jump to that moment.
            </Text>
          )}
          <StandalonePlayer asset={take} comments={comments} label="Your recording">
            {comments.length > 0 && <CommentList comments={comments} />}
          </StandalonePlayer>
        </Stack>

        {feedback ? (
          <Stack component="section" gap="sm" aria-labelledby="coach-title">
            <Title id="coach-title" order={2} size="h3">
              From your coach
            </Title>
            <Card withBorder padding="md">
              <Stack gap="sm">
                <Group gap="sm" wrap="nowrap">
                  <Avatar src={coach.avatarSrc} alt="" />
                  <div>
                    <Text fw={600}>{coach.name}</Text>
                    <Text size="xs" c="dimmed">
                      Sent {formatDate(feedback.sentAt)}
                    </Text>
                  </div>
                </Group>
                <Text>{feedback.body}</Text>
                {reply !== null && (
                  <Stack gap="xs" data-testid="coach-reply">
                    <Text size="sm" fw={600}>
                      {MEDIA_KIND_LABEL[reply.kind]} reply
                    </Text>
                    <StandalonePlayer asset={reply} label="Coach's reply" height={64} />
                  </Stack>
                )}
              </Stack>
            </Card>
          </Stack>
        ) : (
          <Alert variant="light">
            {coach.name} hasn't reviewed this take yet. You'll see comments here once they have.
          </Alert>
        )}

        {next.length > 0 && (
          <Stack component="section" gap="xs" aria-labelledby="next-title">
            <Title id="next-title" order={2} size="h3">
              Next exercises
            </Title>
            <List>
              {next.map((nextItem) => (
                <List.Item key={nextItem.id}>
                  <Anchor component={Link} to={href("/student/exercises/:id", { id: nextItem.id })}>
                    {nextItem.title}
                  </Anchor>
                </List.Item>
              ))}
            </List>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
