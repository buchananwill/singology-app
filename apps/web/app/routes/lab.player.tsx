import { Container, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { fixtureUuid } from "@singology/db";
import type { FeedbackComment } from "@singology/shared";
import { data } from "react-router";

import { StandalonePlayer } from "../components/player/StandalonePlayer";
import { repositoriesContext } from "../context";
import { requireSignedIn } from "../middleware/me";
import type { Route } from "./+types/lab.player";

/** Lab test data, not fixtures. */
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

// Media rows are readable only by a signed-in user they belong to (these are the seeded student
// takes and demo video), so the page asks for a session rather than failing as anon.
export const middleware: Route.MiddlewareFunction[] = [requireSignedIn()];

export async function loader({ context }: Route.LoaderArgs) {
  const repositories = context.get(repositoriesContext);
  const [takeA, takeB, video] = await Promise.all([
    repositories.media.get(fixtureUuid("media-student-take-a")),
    repositories.media.get(fixtureUuid("media-student-take-b")),
    repositories.media.get(fixtureUuid("media-test-pattern")),
  ]);
  if (!takeA || !takeB || !video) {
    throw data("Lab media is missing: is the database seeded?", { status: 404 });
  }
  return { takeA, takeB, video, comments: LAB_COMMENTS };
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
          <StandalonePlayer asset={takeA} label="Student take with comments" comments={comments} />
        </Stack>

        <Stack component="section" gap="xs" data-testid="lab-hls">
          <Title order={2} size="h3">
            HLS video
          </Title>
          <StandalonePlayer asset={video} label="Test-pattern video (HLS)" />
        </Stack>

        <Stack component="section" gap="xs" data-testid="lab-side-by-side">
          <Title order={2} size="h3">
            Two takes side by side
          </Title>
          <SimpleGrid cols={{ base: 1, md: 2 }}>
            <StandalonePlayer asset={takeA} label="Take A" />
            <StandalonePlayer asset={takeB} label="Take B" />
          </SimpleGrid>
        </Stack>
      </Stack>
    </Container>
  );
}
