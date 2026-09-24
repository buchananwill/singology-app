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
import { data, Link } from "react-router";

import { CommentList } from "../components/player/CommentList";
import { PlayerProvider } from "../components/player/PlayerProvider";
import { WaveformPlayer } from "../components/player/WaveformPlayer";
import { repositoriesContext, studentIdContext } from "../context";
import { CATEGORY_LABEL, formatDate } from "../lib/format";
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
  const [take, item, coach, feedback, assignments] = await Promise.all([
    repositories.media.get(submission.mediaId),
    repositories.library.get(submission.libraryItemId),
    repositories.coaches.get(enrolment.coachId),
    repositories.feedback.forSubmission(submission.id),
    repositories.assignments.forStudent(studentId),
  ]);
  if (!take || !item || !coach) {
    throw data("Submission data not found", { status: 404 });
  }
  const [comments, reply, next] = await Promise.all([
    feedback ? repositories.feedback.comments(feedback.id) : [],
    feedback?.replyMediaId ? repositories.media.get(feedback.replyMediaId) : undefined,
    repositories.library.getMany(
      assignments.filter((a) => a.status === "todo").map((a) => a.libraryItemId),
    ),
  ]);
  return {
    submission,
    take,
    item,
    coach: { name: coach.displayName, avatarSrc: coach.avatarSrc },
    feedback: feedback ?? null,
    comments,
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
            <Anchor component={Link} to={`/student/exercises/${item.id}`} size="sm">
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
          <PlayerProvider>
            <WaveformPlayer asset={take} comments={comments} label="Your recording" />
            {comments.length > 0 && <CommentList comments={comments} />}
          </PlayerProvider>
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
                      {reply.kind === "video" ? "Video reply" : "Audio reply"}
                    </Text>
                    <PlayerProvider>
                      <WaveformPlayer asset={reply} label="Coach's reply" height={64} />
                    </PlayerProvider>
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
                  <Anchor component={Link} to={`/student/exercises/${nextItem.id}`}>
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
