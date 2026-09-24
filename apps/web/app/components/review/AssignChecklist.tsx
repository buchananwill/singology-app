import { Badge, Checkbox, Group, Stack, Text } from "@mantine/core";
import type { LibraryItem } from "@singology/shared";

import { CATEGORY_LABEL } from "../../lib/format";

export type AssignableItem = Pick<LibraryItem, "id" | "title" | "category">;

export interface AssignChecklistProps {
  items: readonly AssignableItem[];
  value: readonly string[];
  onChange(libraryItemIds: string[]): void;
  disabled?: boolean;
}

export function AssignChecklist({ items, value, onChange, disabled }: AssignChecklistProps) {
  return (
    <Checkbox.Group
      label="Assign next exercises"
      description="Ticked exercises appear on the student's This week list."
      value={[...value]}
      onChange={onChange}
      data-testid="assign-checklist"
    >
      <Stack gap="xs" mt="xs">
        {items.map((item) => (
          <Checkbox
            key={item.id}
            value={item.id}
            disabled={disabled}
            label={
              <Group gap="xxs" wrap="nowrap" component="span">
                <Text span size="sm">
                  {item.title}
                </Text>
                <Badge variant="light" size="xs" component="span">
                  {CATEGORY_LABEL[item.category]}
                </Badge>
              </Group>
            }
          />
        ))}
      </Stack>
    </Checkbox.Group>
  );
}
