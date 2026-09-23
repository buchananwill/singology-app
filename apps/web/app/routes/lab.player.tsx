import { Container, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import type { FeedbackComment, MediaAsset } from "@singology/shared";
import { data } from "react-router";

import { PlayerProvider } from "../components/player/PlayerProvider";
import { WaveformPlayer } from "../components/player/WaveformPlayer";
import { repositoriesContext } from "../context";
import type { Route } from "./+types/lab.player";

/**
 * Regression page for the waveform player (stage 2). Not linked from the
 * navigation. The comments below are lab test data, not fixtures.
 */
const LAB_COMMENTS: FeedbackComment[] = [
  {
    id: "lab-comment-1",
    feedbackId: "lab-feedback",
    tSeconds: 5.2,
    body: "Lovely easy onset on the first note.",
  },
  {
    id: "lab-comment-2",
    feedbackId: "lab-feedback",
    tSeconds: 24,
    body: "The top note is a little flat: think up before you sing it.",
  },
  {
    id: "lab-comment-3",
    feedbackId: "lab-feedback",
    tSeconds: 52.5,
    body: "Vibrato settles nicely here. Keep the breath moving.",
  },
];

export const meta: Route.MetaFunction = () => [
  { title: "Player lab | Singology" },
  { name: "robots", content: "noindex" },
];

export async function loader({ context }: Route.LoaderArgs) {
  const repositories = context.get(repositoriesContext);
  const [takeA, takeB, video] = await Promise.all([
    repositories.media.get("media-student-take-a"),
    repositories.media.get("media-student-take-b"),
    repositories.media.get("media-test-pattern"),
  ]);
  if (!takeA || !takeB || !video) {
    throw data("Lab media fixtures are missing", { status: 404 });
  }
  return { takeA, takeB, video, comments: LAB_COMMENTS };
}

function LabPlayer({
  asset,
  label,
  comments,
}: {
  asset: MediaAsset;
  label: string;
  comments?: FeedbackComment[];
}) {
  return (
    <PlayerProvider>
      <WaveformPlayer asset={asset} label={label} comments={comments} />
    </PlayerProvider>
  );
}

export default function PlayerLab({ loaderData }: Route.ComponentProps) {
  const { takeA, takeB, video, comments } = loaderData;
  return (
    <Container size="lg">
      <Stack gap="xl">
        <div>
          <Title order={1}>Player lab</Title>
          <Text c="dimmed">Regression page for the waveform player. Not linked from the app.</Text>
        </div>

        <Stack component="section" gap="xs" data-testid="lab-audio">
          <Title order={2} size="h3">
            Audio take with comments
          </Title>
          <LabPlayer asset={takeA} label="Student take with comments" comments={comments} />
        </Stack>

        <Stack component="section" gap="xs" data-testid="lab-hls">
          <Title order={2} size="h3">
            HLS video
          </Title>
          <LabPlayer asset={video} label="Test-pattern video (HLS)" />
        </Stack>

        <Stack component="section" gap="xs" data-testid="lab-side-by-side">
          <Title order={2} size="h3">
            Two takes side by side
          </Title>
          <SimpleGrid cols={{ base: 1, md: 2 }}>
            <LabPlayer asset={takeA} label="Take A" />
            <LabPlayer asset={takeB} label="Take B" />
          </SimpleGrid>
        </Stack>
      </Stack>
    </Container>
  );
}
