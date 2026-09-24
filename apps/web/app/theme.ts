import { createTheme, type DefaultMantineColor, type MantineColorsTuple, rem } from "@mantine/core";

declare module "@mantine/core" {
  export interface MantineThemeColorsOverride {
    colors: Record<DefaultMantineColor | "brand", MantineColorsTuple>;
  }
}

/** Placeholder muted teal until the founder picks brand colours. */
const brand: MantineColorsTuple = [
  "#e8f7f6",
  "#d5ebe9",
  "#a8d6d2",
  "#78c0ba",
  "#52aea6",
  "#3aa299",
  "#2b9c92",
  "#1b887f",
  "#0b7971",
  "#006961",
];

export const theme = createTheme({
  primaryColor: "brand",
  colors: { brand },
  defaultRadius: "md",
  spacing: { xxs: rem(4), xxl: rem(48) },
  fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
});
