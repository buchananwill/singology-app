import { Anchor, Badge, Container, Group, List, Stack, Text, Title } from "@mantine/core";
import { RecordingUploadSchema } from "@singology/shared";
import { data, Link } from "react-router";

import { PlayerProvider } from "../components/player/PlayerProvider";
import { WaveformPlayer } from "../components/player/WaveformPlayer";
import { UploadPanel } from "../components/upload/UploadPanel";
import { repositoriesContext, studentIdContext } from "../context";
import { type MessageResult, parseInput } from "../lib/actionResult";
import {
  ASSIGNMENT_STATUS_COLOR,
  ASSIGNMENT_STATUS_LABEL,
  CATEGORY_LABEL,
  formatDate,
  VOICE_TYPE_LABEL,
} from "../lib/format";
import type { Route } from "./+types/student.exercise";

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: `${loaderData?.item.title ?? "Exercise"} | Singology` },
];

export async function loader({ context, params }: Route.LoaderArgs) {
  const repositories = context.get(repositoriesContext);
  const studentId = context.get(studentIdContext);
  const item = await repositories.library.get(params.id);
  if (!item) {
    throw data("Exercise not found", { status: 404 });
  }
  const [demo, backingTrack, assignments, submissions] = await Promise.all([
    repositories.media.get(item.demoMediaId),
    item.backingTrackMediaId ? repositories.media.get(item.backingTrackMediaId) : undefined,
    repositories.assignments.forStudent(studentId),
    repositories.submissions.forStudent(studentId),
  ]);
  if (!demo) {
    throw data("Exercise media not found", { status: 404 });
  }
  const assignment = assignments
    .filter((a) => a.libraryItemId === item.id)
    .sort((a, b) => b.assignedAt.localeCompare(a.assignedAt))[0];
  const previousTakes = submissions
    .filter((s) => s.libraryItemId === item.id)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .map((s) => ({ id: s.id, submittedAt: s.submittedAt, reviewed: s.status === "reviewed" }));
  return {
    item,
    demo,
    backingTrack: backingTrack ?? null,
    assignment: assignment ?? null,
    previousTakes,
  };
}

/** Validates the upload and reports success without persisting anything (decision 11). */
export async function action({ context, params, request }: Route.ActionArgs) {
  const item = await context.get(repositoriesContext).library.get(params.id);
  const parsed = parseInput(
    RecordingUploadSchema,
    await request.json().catch(() => null),
    "The upload details were not valid.",
  );
  if (!item) {
    return data<MessageResult>({ ok: false, error: "Exercise not found." }, { status: 404 });
  }
  if (!parsed.ok) {
    return data<MessageResult>({ ok: false, error: parsed.error }, { status: 400 });
  }
  return data<MessageResult>({
    ok: true,
    message: `"${parsed.data.fileName}" is with your coach for "${item.title}". This is a demo, so nothing was saved.`,
  });
}

export default function StudentExercise({ loaderData }: Route.ComponentProps) {
  const { item, demo, backingTrack, assignment, previousTakes } = loaderData;
  return (
    <Container size="md">
      <Stack gap="lg">
        <div>
          <Group gap="xs" mb={4}>
            <Badge variant="light">{CATEGORY_LABEL[item.category]}</Badge>
            {assignment !== null && (
              <Badge variant="light" color={ASSIGNMENT_STATUS_COLOR[assignment.status]}>
                {ASSIGNMENT_STATUS_LABEL[assignment.status]}
              </Badge>
            )}
          </Group>
          <Title order={1}>{item.title}</Title>
          <Text size="sm" c="dimmed">
            For {item.voiceTypes.map((v) => VOICE_TYPE_LABEL[v]).join(", ")}
          </Text>
        </div>

        <Stack component="section" gap="xs" aria-labelledby="instructions-title">
          <Title id="instructions-title" order={2} size="h3">
            How to do it
          </Title>
          <Text>{item.instructions}</Text>
        </Stack>

        <Stack
          component="section"
          gap="xs"
          aria-labelledby="demo-title"
          data-testid="exercise-demo"
        >
          <Title id="demo-title" order={2} size="h3">
            Demonstration
          </Title>
          <PlayerProvider>
            <WaveformPlayer asset={demo} label="Demonstration" height={64} />
          </PlayerProvider>
        </Stack>

        {backingTrack !== null && (
          <Stack
            component="section"
            gap="xs"
            aria-labelledby="backing-title"
            data-testid="exercise-backing"
          >
            <Title id="backing-title" order={2} size="h3">
              Backing track
            </Title>
            <Text size="sm" c="dimmed">
              Play this through a speaker while you record. Slow it down to practise.
            </Text>
            <PlayerProvider>
              <WaveformPlayer asset={backingTrack} label="Backing track" height={64} />
            </PlayerProvider>
          </Stack>
        )}

        <UploadPanel
          title="Upload your take"
          submitLabel="Send to your coach"
          successTitle="Recording sent"
          noteLabel="Note for your coach (optional)"
          fields={{ libraryItemId: item.id }}
        />

        {previousTakes.length > 0 && (
          <Stack component="section" gap="xs" aria-labelledby="previous-title">
            <Title id="previous-title" order={2} size="h3">
              Your earlier takes
            </Title>
            <List>
              {previousTakes.map((take) => (
                <List.Item key={take.id}>
                  {take.reviewed ? (
                    <Anchor component={Link} to={`/student/submissions/${take.id}`}>
                      {formatDate(take.submittedAt)}: feedback ready
                    </Anchor>
                  ) : (
                    <Text span>{formatDate(take.submittedAt)}: waiting for your coach</Text>
                  )}
                </List.Item>
              ))}
            </List>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
