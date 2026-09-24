import type { ListProps } from "@mantine/core";

// A List.Item's label is an inline-flex column by default, which shrinks cards and buttons to fit.
export const FULL_WIDTH_LIST_ITEMS: ListProps["styles"] = {
  itemWrapper: { display: "block" },
  itemLabel: { display: "block" },
};
