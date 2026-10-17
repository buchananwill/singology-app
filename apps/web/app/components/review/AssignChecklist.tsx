import { Checkbox, Stack } from "@mantine/core";

import { type AssignableItem, AssignableItemLabel } from "./AssignableItemLabel";

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
            label={<AssignableItemLabel item={item} />}
          />
        ))}
      </Stack>
    </Checkbox.Group>
  );
}
