import { Anchor, Badge, Container, Stack, Text, Timeline, Title } from "@mantine/core";
import type { MediaAsset, Submission } from "@singology/shared";
import { Link } from "react-router";

import { AbCompare } from "../components/compare/AbCompare";
import { repositoriesContext, studentIdContext } from "../context";
import { CATEGORY_LABEL, formatDate } from "../lib/format";
import type { Route } from "./+types/student.progress";

export const meta: Route.MetaFunction = () => [{ title: "Progress | Singology" }];

interface Take {
  submission: Submission;
  asset: MediaAsset;
}

export async function loader({ context }: Route.LoaderArgs) {
  const repositories = context.get(repositoriesContext);
  const submissions = await repositories.submissions.forStudent(context.get(studentIdContext));

  const byItem = new Map<string, Take[]>();
  for (const submission of [...submissions].sort((x, y) =>
    x.submittedAt.localeCompare(y.submittedAt),
  )) {
    const asset = await repositories.media.get(submission.mediaId);
    if (asset) {
      byItem.set(submission.libraryItemId, [
        ...(byItem.get(submission.libraryItemId) ?? []),
        { submission, asset },
      ]);
    }
  }

  const exercises = (
    await Promise.all(
      [...byItem].map(async ([itemId, takes]) => {
        const item = await repositories.library.get(itemId);
        return item ? [{ item, takes }] : [];
      }),
    )
  ).flat();
  // Most recently practised exercise first.
  exercises.sort((x, y) =>
    (y.takes.at(-1)?.submission.submittedAt ?? "").localeCompare(
      x.takes.at(-1)?.submission.submittedAt ?? "",
    ),
  );

  // A/B: the two latest takes of the most recent exercise that has at least two.
  const comparable = exercises.find((exercise) => exercise.takes.length >= 2);
  const compare = comparable
    ? {
        title: comparable.item.title,
        a: comparable.takes.at(-2),
        b: comparable.takes.at(-1),
      }
    : null;

  return { exercises, compare };
}

export default function StudentProgress({ loaderData }: Route.ComponentProps) {
  const { exercises, compare } = loaderData;
  return (
    <Container size="md">
      <Stack gap="xl">
        <div>
          <Title order={1}>Progress</Title>
          <Text c="dimmed">Every take you've sent, by exercise.</Text>
        </div>

        {compare?.a && compare.b && (
          <Stack component="section" gap="sm" aria-labelledby="compare-title">
            <div>
              <Title id="compare-title" order={2} size="h3">
                Compare two takes
              </Title>
              <Text size="sm" c="dimmed">
                {compare.title}: your earlier take (A) against your latest (B).
              </Text>
            </div>
            <AbCompare
              key={`${compare.a.submission.id}-${compare.b.submission.id}`}
              a={{ asset: compare.a.asset, label: formatDate(compare.a.submission.submittedAt) }}
              b={{ asset: compare.b.asset, label: formatDate(compare.b.submission.submittedAt) }}
            />
          </Stack>
        )}

        <Stack component="section" gap="lg" aria-labelledby="timeline-title">
          <Title id="timeline-title" order={2} size="h3">
            Timeline
          </Title>
          {exercises.map(({ item, takes }) => (
            <Stack key={item.id} gap="xs" data-testid="progress-exercise">
              <Text fw={600}>
                <Anchor component={Link} to={`/student/exercises/${item.id}`} c="inherit">
                  {item.title}
                </Anchor>{" "}
                <Badge variant="light" size="sm">
                  {CATEGORY_LABEL[item.category]}
                </Badge>
              </Text>
              <Timeline active={takes.length - 1} bulletSize={16} lineWidth={2}>
                {takes.map(({ submission }, index) => (
                  <Timeline.Item
                    key={submission.id}
                    title={`Take ${index + 1}: ${formatDate(submission.submittedAt)}`}
                  >
                    {submission.status === "reviewed" ? (
                      <Anchor component={Link} to={`/student/submissions/${submission.id}`} size="sm">
                        Feedback ready
                      </Anchor>
                    ) : (
                      <Text size="sm" c="dimmed">
                        Waiting for your coach
                      </Text>
                    )}
                  </Timeline.Item>
                ))}
              </Timeline>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Container>
  );
}
