import { Container, List, Stack, Text, Title } from "@mantine/core";
import { data } from "react-router";

import { QueueCard } from "../components/coach/QueueCard";
import { RecentlyReviewedCard } from "../components/coach/RecentlyReviewedCard";
import { PlainOrderedList } from "../components/PlainOrderedList";
import { coachIdContext, repositoriesContext, requestTimeContext } from "../context";
import { formatTurnaround } from "../lib/format";
import { useNow } from "../lib/useNow";
import { PageTitle } from "../components/shell/PageTitle";
import type { Route } from "./+types/coach.home";

const RECENTLY_REVIEWED_LIMIT = 10;

export const meta: Route.MetaFunction = () => [{ title: "Review queue | Singology" }];

export async function loader({ context }: Route.LoaderArgs) {
  const repositories = context.get(repositoriesContext);
  const coachId = context.get(coachIdContext);
  const [coach, items, recent] = await Promise.all([
    repositories.coaches.get(coachId),
    repositories.submissions.queueViewForCoach(coachId),
    repositories.submissions.recentlyReviewedForCoach(coachId, RECENTLY_REVIEWED_LIMIT),
  ]);
  if (!coach) {
    throw data("The demo coach was not found", { status: 404 });
  }
  return {
    // The server renders every countdown from the request time.
    now: context.get(requestTimeContext).getTime(),
    turnaroundHours: coach.turnaroundHours,
    items,
    recent,
  };
}

export default function CoachQueue({ loaderData }: Route.ComponentProps) {
  const { turnaroundHours, items, recent } = loaderData;
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
            {items.map((queued) => (
              <List.Item key={queued.submission.id}>
                <QueueCard queued={queued} now={now} turnaroundHours={turnaroundHours} />
              </List.Item>
            ))}
          </PlainOrderedList>
        )}

        <Stack component="section" gap="sm" aria-labelledby="recent-title">
          <Title id="recent-title" order={2} size="h3">
            Recently reviewed
          </Title>
          {recent.length === 0 ? (
            <Text>Nothing reviewed yet.</Text>
          ) : (
            <PlainOrderedList spacing="sm">
              {recent.map((reviewed) => (
                <List.Item key={reviewed.submission.id}>
                  <RecentlyReviewedCard reviewed={reviewed} />
                </List.Item>
              ))}
            </PlainOrderedList>
          )}
        </Stack>
      </Stack>
    </Container>
  );
}
