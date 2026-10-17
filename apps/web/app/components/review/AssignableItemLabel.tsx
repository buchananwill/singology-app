import { Badge, Group, Text } from "@mantine/core";
import type { LibraryItem } from "@singology/shared";

import { CATEGORY_LABEL } from "../../lib/format";

export type AssignableItem = Pick<LibraryItem, "id" | "title" | "category">;

export interface AssignableItemLabelProps {
  item: AssignableItem;
}

export function AssignableItemLabel({ item }: AssignableItemLabelProps) {
  return (
    <Group gap="xxs" wrap="nowrap" component="span">
      <Text span size="sm">
        {item.title}
      </Text>
      <Badge variant="light" size="xs" component="span">
        {CATEGORY_LABEL[item.category]}
      </Badge>
    </Group>
  );
}
