import { Button, Container, SimpleGrid, Stack, Table, Text, ThemeIcon, Title } from "@mantine/core";
import { type CoachOffer, formatCount } from "@singology/shared";
import { href, Link } from "react-router";

import { CoachCard } from "../components/CoachCard";
import { Eyebrow } from "../components/landing/Eyebrow";
import { HeroPanel } from "../components/landing/HeroPanel";
import { repositoriesContext } from "../context";
import { formatPence } from "../lib/format";
import type { Route } from "./+types/home";

export const meta: Route.MetaFunction = () => [
  { title: "Singology: singing feedback for choir members" },
  {
    name: "description",
    content:
      "Weekly singing exercises, recorded on your phone, with timestamped feedback from a coach.",
  },
];

export async function loader({ context }: Route.LoaderArgs) {
  const repositories = context.get(repositoriesContext);
  const coaches = await repositories.coaches.listWithOffers();
  return {
    coaches: coaches.map(({ coach, offers }) => ({
      coach,
      monthly: offers.find((offer) => offer.billing === "monthly"),
      single: offers.find((offer) => offer.billing === "single"),
    })),
  };
}

function formatMonthlyOffer({ pricePence, submissionsPerPeriod }: CoachOffer): string {
  return `${formatPence(pricePence)} a month for ${formatCount(submissionsPerPeriod, "review", "reviews")}`;
}

const STEPS = [
  {
    title: "Practise with the library",
    body: "Short exercises for breathing, clean starts to notes, range and agility. Each has a demonstration and a backing track, and your coach chooses which ones to work on each week.",
  },
  {
    title: "Record on your phone and upload",
    body: "Use the voice recorder or camera you already have. There's no special equipment and nothing to install. Sing the exercise, then upload the take.",
  },
  {
    title: "Get timestamped feedback",
    body: "Every take is heard start to finish, and each comment is pinned to the second it's about, so you hear exactly what your coach means. Then they set your next exercises.",
  },
] as const;

export default function Home({ loaderData }: Route.ComponentProps) {
  const { coaches } = loaderData;
  return (
    <>
      <HeroPanel
        eyebrow="For choir singers"
        title="Personal singing feedback between choir rehearsals"
        lead="Singology is for people who sing in community choirs and want to improve on their own voice. Practise a short exercise, record it on your phone, and a coach sends back comments pinned to the moments that matter."
        aside="If you've never had a lesson, you're exactly who this is for."
        action={
          <Button component={Link} to={href("/sign-in")} size="md">
            Sign in
          </Button>
        }
      />
      <Container size="md">
        <Stack gap="xxl" py="lg">
          <Stack component="section" gap="md" aria-labelledby="how-title">
            <Eyebrow>Three steps</Eyebrow>
            <Title id="how-title" order={2}>
              How it works
            </Title>
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
              {STEPS.map((step, index) => (
                <Stack key={step.title} gap="xs">
                  <ThemeIcon radius="xl" size="lg" variant="light">
                    {index + 1}
                  </ThemeIcon>
                  <Title order={3} size="h4">
                    {step.title}
                  </Title>
                  <Text size="sm">{step.body}</Text>
                </Stack>
              ))}
            </SimpleGrid>
          </Stack>

          <Stack component="section" gap="md" aria-labelledby="coaches-title">
            <Eyebrow>Who you will work with</Eyebrow>
            <Title id="coaches-title" order={2}>
              The coaches
            </Title>
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              {coaches.map(({ coach }) => (
                <CoachCard key={coach.id} {...coach} />
              ))}
            </SimpleGrid>
          </Stack>

          <Stack component="section" gap="md" aria-labelledby="pricing-title">
            <Eyebrow>Plans</Eyebrow>
            <Title id="pricing-title" order={2}>
              Pricing
            </Title>
            <Table withTableBorder data-testid="pricing-table">
              <Table.Caption>
                Illustrative pricing. These figures show how plans could work and are not final.
              </Table.Caption>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Coach</Table.Th>
                  <Table.Th>Monthly plan</Table.Th>
                  <Table.Th>Single review</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {coaches.map(({ coach, monthly, single }) => (
                  <Table.Tr key={coach.id}>
                    <Table.Th scope="row">{coach.displayName}</Table.Th>
                    <Table.Td>{monthly ? formatMonthlyOffer(monthly) : "–"}</Table.Td>
                    <Table.Td>{single ? formatPence(single.pricePence) : "–"}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            <Text size="sm" c="dimmed">
              A monthly plan includes the number of reviews shown, every month. A single review is a
              way to try it once.
            </Text>
          </Stack>

          <Stack component="section" gap="sm" align="flex-start" aria-labelledby="cta-title">
            <Eyebrow>Private alpha</Eyebrow>
            <Title id="cta-title" order={2} size="h3">
              Already invited?
            </Title>
            <Text>
              Singology is in a private alpha. If you have an invitation, sign in with your email
              address and we'll send you a link.
            </Text>
            <Button component={Link} to={href("/sign-in")}>
              Sign in
            </Button>
          </Stack>
        </Stack>
      </Container>
    </>
  );
}
