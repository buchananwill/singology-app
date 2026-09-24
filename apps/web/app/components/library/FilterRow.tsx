import { Button, Group, Stack, Text } from "@mantine/core";
import { Link } from "react-router";

export interface FilterRowProps<FilterValue extends string> {
  label: string;
  values: readonly FilterValue[];
  labels: Record<FilterValue, string>;
  current: FilterValue | undefined;
  hrefFor(value: FilterValue | undefined): string;
}

export function FilterRow<FilterValue extends string>({
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
