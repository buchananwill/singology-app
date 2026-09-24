import { List, type ListProps } from "@mantine/core";
import type { ReactNode } from "react";

// A List.Item's label is an inline-flex column by default, which shrinks cards and buttons to fit.
const FULL_WIDTH_ITEMS: ListProps["styles"] = {
  itemWrapper: { display: "block" },
  itemLabel: { display: "block" },
};

export interface PlainOrderedListProps {
  spacing: ListProps["spacing"];
  children: ReactNode;
}

export function PlainOrderedList({ spacing, children }: PlainOrderedListProps) {
  return (
    <List type="ordered" listStyleType="none" spacing={spacing} styles={FULL_WIDTH_ITEMS}>
      {children}
    </List>
  );
}
