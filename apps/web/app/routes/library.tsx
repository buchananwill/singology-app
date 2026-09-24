import {
  Anchor,
  Badge,
  Button,
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

import { demoRoleContext, repositoriesContext } from "../context";
import { CATEGORY_LABEL, formatCount, VOICE_TYPE_LABEL } from "../lib/format";
import type { Route } from "./+types/library";

export const meta: Route.MetaFunction = () => [{ title: "Exercise library | Singology" }];

/** The search param names that hold the filters. */
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
  return {
    filter,
    items,
    // Only the student view has exercise pages.
    linkToExercises: context.get(demoRoleContext) === "student",
  };
}

export interface FilterRowProps<FilterValue extends string> {
  label: string;
  values: readonly FilterValue[];
  labels: Record<FilterValue, string>;
  current: FilterValue | undefined;
  hrefFor(value: FilterValue | undefined): string;
}

function FilterRow<FilterValue extends string>({
  label,
  values,
  labels,
  current,
  hrefFor,
}: FilterRowProps<FilterValue>) {
  const options: { value: FilterValue | undefined; text: string }[] = [
    { value: undefined, text: "All" },
    ...values.map((value) => ({ value, text: labels[value] })),
  ];
  return (
    <Stack gap="xxs" role="group" aria-label={label}>
      <Text size="sm" fw={600}>
        {label}
      </Text>
      <Group gap="xxs">
        {options.map(({ value, text }) => {
          const selected = value === current;
          return (
            <Button
              key={text}
              component={Link}
              to={hrefFor(value)}
              size="compact-sm"
              radius="xl"
              variant={selected ? "filled" : "default"}
              aria-current={selected ? "true" : undefined}
              preventScrollReset
            >
              {text}
            </Button>
          );
        })}
      </Group>
    </Stack>
  );
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
