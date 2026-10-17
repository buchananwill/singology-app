import { Badge, Button, Card, Container, Group, List, Stack, Text } from "@mantine/core";
import { reviewSla } from "@singology/shared";
import { data, href, Link } from "react-router";

import { PlainOrderedList } from "../components/PlainOrderedList";
import { coachIdContext, repositoriesContext, requestTimeContext } from "../context";
import {
  CATEGORY_LABEL,
  formatSince,
  formatTimeLeft,
  formatTurnaround,
  MEDIA_KIND_LABEL,
  SLA_COLOR,
} from "../lib/format";
import { useNow } from "../lib/useNow";
import { PageTitle } from "../components/shell/PageTitle";
import type { Route } from "./+types/coach.home";

export const meta: Route.MetaFunction = () => [{ title: "Review queue | Singology" }];

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
    // The server renders every countdown from the request time.
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
        <PageTitle
          title="Review queue"
          description={
            <>
              Oldest first. You promise feedback within {formatTurnaround(turnaroundHours)} of each
              upload.
            </>
          }
        />

        {items.length === 0 ? (
          <Text>Nothing waiting for review. Well done.</Text>
        ) : (
          <PlainOrderedList spacing="sm">
            {items.map(({ submission, student, item, mediaKind }) => {
              const sla = reviewSla(submission.submittedAt, now, turnaroundHours);
              return (
                <List.Item key={submission.id}>
                  <Card padding="md" data-testid="queue-item" data-sla={sla.state}>
                    <Stack gap="xs">
                      <Group justify="space-between" align="flex-start" wrap="wrap" gap="xs">
                        <Stack gap={0}>
                          <Text fw={600} data-testid="queue-student">
                            {student.displayName}
                          </Text>
                          <Text size="sm" c="dimmed">
                            {item.title} · {CATEGORY_LABEL[item.category]} ·{" "}
                            {MEDIA_KIND_LABEL[mediaKind]}
                          </Text>
                        </Stack>
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
                          Submitted {formatSince(submission.submittedAt, now, turnaroundHours)}
                        </Text>
                        <Button
                          component={Link}
                          to={href("/coach/reviews/:submissionId", { submissionId: submission.id })}
                          size="sm"
                        >
                          Review
                        </Button>
                      </Group>
                    </Stack>
                  </Card>
                </List.Item>
              );
            })}
          </PlainOrderedList>
        )}
      </Stack>
    </Container>
  );
}
