import {
  Box,
  Button,
  Container,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import type { CoachOffer } from "@singology/shared";
import { Link } from "react-router";

import { CoachCard } from "../components/CoachCard";
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

/** A monthly offer as `£80 a month for 4 reviews`. */
function formatMonthlyOffer({ pricePence, submissionsPerPeriod }: CoachOffer): string {
  const reviews = submissionsPerPeriod === 1 ? "review" : "reviews";
  return `${formatPence(pricePence)} a month for ${submissionsPerPeriod} ${reviews}`;
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
    body: "Your coach listens properly and pins comments to the exact moments that matter, so you can hear what they mean. Then they set your next exercises.",
  },
] as const;

export default function Home({ loaderData }: Route.ComponentProps) {
  const { coaches } = loaderData;
  return (
    <Container size="md">
      <Stack gap={48} py="lg">
        <Stack component="section" gap="md" aria-labelledby="hero-title">
          <Title id="hero-title" order={1}>
            Personal singing feedback between choir rehearsals
          </Title>
          <Text size="lg">
            Singology is for people who sing in community choirs and want to improve on their own
            voice. Practise a short exercise, record it on your phone, and a coach sends back
            comments pinned to the moments that matter.
          </Text>
          <Box>
            <Button component={Link} to="/demo" size="md">
              Try the demo
            </Button>
          </Box>
        </Stack>

        <Stack component="section" gap="md" aria-labelledby="how-title">
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
          <Title id="cta-title" order={2} size="h3">
            See it for yourself
          </Title>
          <Text>
            The demo uses sample data, so you can look around as a student or as a coach without
            signing up.
          </Text>
          <Button component={Link} to="/demo">
            Try the demo
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
