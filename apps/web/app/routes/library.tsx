import {
  Anchor,
  Badge,
  Card,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  LIBRARY_CATEGORIES,
  type LibraryFilter,
  LibraryFilterSchema,
  VOICE_TYPES,
} from "@singology/shared";
import { href, Link } from "react-router";

import { FilterRow } from "../components/library/FilterRow";
import { meContext, repositoriesContext } from "../context";
import { CATEGORY_LABEL, formatCount, VOICE_TYPE_LABEL } from "../lib/format";
import { holdsRole } from "../lib/roles";
import type { Route } from "./+types/library";

export const meta: Route.MetaFunction = () => [{ title: "Exercise library | Singology" }];

const PARAM = { category: "category", voiceType: "voice" } as const;

function readFilter(searchParams: URLSearchParams): LibraryFilter {
  return LibraryFilterSchema.parse({
    category: searchParams.get(PARAM.category),
    voiceType: searchParams.get(PARAM.voiceType),
  });
}

function libraryHref(filter: LibraryFilter): string {
  const params = new URLSearchParams();
  if (filter.category) {
    params.set(PARAM.category, filter.category);
  }
  if (filter.voiceType) {
    params.set(PARAM.voiceType, filter.voiceType);
  }
  const query = params.toString();
  return query ? `${href("/library")}?${query}` : href("/library");
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const filter = readFilter(new URL(request.url).searchParams);
  const items = await context.get(repositoriesContext).library.list(filter);
  const me = context.get(meContext);
  return {
    filter,
    items,
    // Exercise pages are student pages.
    linkToExercises: me !== null && holdsRole(me, "student"),
  };
}

export default function Library({ loaderData }: Route.ComponentProps) {
  const { filter, items, linkToExercises } = loaderData;
  return (
    <Container size="md">
      <Stack gap="lg">
        <div>
          <Title order={1}>Exercise library</Title>
          <Text c="dimmed">Short exercises for breath, onsets, range and agility.</Text>
        </div>

        <Stack gap="sm">
          <FilterRow
            label="Category"
            values={LIBRARY_CATEGORIES}
            labels={CATEGORY_LABEL}
            current={filter.category}
            hrefFor={(category) => libraryHref({ ...filter, category })}
          />
          <FilterRow
            label="Voice type"
            values={VOICE_TYPES}
            labels={VOICE_TYPE_LABEL}
            current={filter.voiceType}
            hrefFor={(voiceType) => libraryHref({ ...filter, voiceType })}
          />
        </Stack>

        <Text size="sm" c="dimmed" aria-live="polite" data-testid="library-count">
          {formatCount(items.length, "exercise", "exercises")}
        </Text>

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          {items.map((item) => (
            <Card key={item.id} withBorder padding="md" data-testid="library-item">
              <Stack gap="xxs">
                <Group justify="space-between" wrap="nowrap" align="flex-start">
                  {linkToExercises ? (
                    <Anchor
                      component={Link}
                      to={href("/student/exercises/:id", { id: item.id })}
                      fw={600}
                    >
                      {item.title}
                    </Anchor>
                  ) : (
                    <Text fw={600}>{item.title}</Text>
                  )}
                  <Badge variant="light" flex="none">
                    {CATEGORY_LABEL[item.category]}
                  </Badge>
                </Group>
                <Text size="sm" lineClamp={2}>
                  {item.instructions}
                </Text>
                <Text size="xs" c="dimmed">
                  {item.voiceTypes.length === VOICE_TYPES.length
                    ? "All voice types"
                    : item.voiceTypes.map((v) => VOICE_TYPE_LABEL[v]).join(", ")}
                </Text>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
        {items.length === 0 && (
          <Text>
            No exercises match.{" "}
            <Anchor component={Link} to={href("/library")}>
              Clear the filters
            </Anchor>
          </Text>
        )}
      </Stack>
    </Container>
  );
}
