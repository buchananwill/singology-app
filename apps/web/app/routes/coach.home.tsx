import { Badge, Button, Card, Container, Group, List, Stack, Text, Title } from "@mantine/core";
import { reviewSla, type ReviewSlaState } from "@singology/shared";
import { data, Link } from "react-router";

import { FULL_WIDTH_LIST_ITEMS } from "../components/fullWidthListItems";
import { coachIdContext, repositoriesContext, requestTimeContext } from "../context";
import { CATEGORY_LABEL, formatElapsed, formatTimeLeft, formatTurnaround } from "../lib/format";
import { useNow } from "../lib/useNow";
import type { Route } from "./+types/coach.home";

export const meta: Route.MetaFunction = () => [{ title: "Review queue | Singology" }];

const SLA_COLOR: Record<ReviewSlaState, string> = {
  on_track: "teal",
  due_soon: "orange",
  overdue: "red",
};

export async function loader({ context }: Route.LoaderArgs) {
  const repositories = context.get(repositoriesContext);
  const coachId = context.get(coachIdContext);
  const [coach, items] = await Promise.all([
    repositories.coaches.get(coachId),
    repositories.submissions.queueViewForCoach(coachId),
  ]);
  if (!coach) {
    throw data("The demo coach was not found", { status: 404 });
  }
  return {
    /** The instant fixture times were resolved against: the server renders every countdown from it. */
    now: context.get(requestTimeContext).getTime(),
    turnaroundHours: coach.turnaroundHours,
    items,
  };
}

export default function CoachQueue({ loaderData }: Route.ComponentProps) {
  const { turnaroundHours, items } = loaderData;
  // The request time on the server and during hydration; the live browser clock afterwards.
  const now = useNow(loaderData.now);
  return (
    <Container size="md">
      <Stack gap="lg">
        <div>
          <Title order={1}>Review queue</Title>
          <Text c="dimmed">
            Oldest first. You promise feedback within {formatTurnaround(turnaroundHours)} of each
            upload.
          </Text>
        </div>

        {items.length === 0 ? (
          <Text>Nothing waiting for review. Well done.</Text>
        ) : (
          <List type="ordered" listStyleType="none" spacing="sm" styles={FULL_WIDTH_LIST_ITEMS}>
            {items.map(({ submission, student, item, mediaKind }) => {
              const sla = reviewSla(submission.submittedAt, now, turnaroundHours);
              return (
                <List.Item key={submission.id}>
                  <Card withBorder padding="md" data-testid="queue-item" data-sla={sla.state}>
                    <Stack gap="xs">
                      <Group justify="space-between" align="flex-start" wrap="wrap" gap="xs">
                        <div>
                          <Text fw={600} data-testid="queue-student">
                            {student.displayName}
                          </Text>
                          <Text size="sm" c="dimmed">
                            {item.title} · {CATEGORY_LABEL[item.category]} ·{" "}
                            {mediaKind === "video" ? "Video" : "Audio"}
                          </Text>
                        </div>
                        <Badge
                          color={SLA_COLOR[sla.state]}
                          variant="light"
                          size="lg"
                          tt="none"
                          data-testid="queue-sla"
                          flex="none"
                        >
                          {sla.state === "due_soon" && "Due soon: "}
                          {formatTimeLeft(sla.remainingMs)}
                        </Badge>
                      </Group>
                      {submission.note !== "" && (
                        <Text size="sm" fs="italic" data-testid="queue-note">
                          “{submission.note}”
                        </Text>
                      )}
                      <Group justify="space-between" align="center" wrap="wrap" gap="xs">
                        <Text size="sm" c="dimmed" data-testid="queue-submitted">
                          Submitted{" "}
                          {formatElapsed(
                            now - new Date(submission.submittedAt).getTime(),
                            turnaroundHours,
                          )}
                        </Text>
                        <Button component={Link} to={`/coach/reviews/${submission.id}`} size="sm">
                          Review
                        </Button>
                      </Group>
                    </Stack>
                  </Card>
                </List.Item>
              );
            })}
          </List>
        )}
      </Stack>
    </Container>
  );
}
