import {
  Badge,
  Button,
  Card,
  createTheme,
  type CSSVariablesResolver,
  type DefaultMantineColor,
  type MantineColorsTuple,
  rem,
  Title,
} from "@mantine/core";

declare module "@mantine/core" {
  export interface MantineThemeColorsOverride {
    colors: Record<DefaultMantineColor | "brand" | "navy" | "olive", MantineColorsTuple>;
  }
}

export const brandTokens = {
  charcoal: "#494947",
  muted: "#696969",
  lineStrong: "#80869a",
  lime100: "#e4efb8",
  onStageMuted: "#c9cdd6",
} as const;

const brand: MantineColorsTuple = [
  "#eafbee",
  "#d2f6db",
  "#aaf0bc",
  "#80e596",
  "#66e082",
  "#4fdb6d",
  "#3fc95c",
  "#1c7a34",
  "#176b2d",
  "#115423",
];

const navy: MantineColorsTuple = [
  "#eef0f4",
  "#d9dde6",
  "#b8bfce",
  "#939db3",
  "#6b7a93",
  "#4d5d76",
  "#35465c",
  "#373b4d",
  "#2a2d3c",
  "#1f2230",
];

const olive: MantineColorsTuple = [
  "#f4f8e4",
  "#e8efc9",
  "#d6e2a3",
  "#c3d479",
  "#b0c65e",
  "#9db946",
  "#7b9334",
  "#5b7020",
  "#4a5c1a",
  "#3a4814",
];

export const BRAND_SHADE = 5;

export const theme = createTheme({
  primaryColor: "brand",
  primaryShade: BRAND_SHADE,
  colors: { brand, navy, olive },
  black: navy[7],
  autoContrast: true,
  defaultRadius: "sm",
  spacing: { xxs: rem(4), xxl: rem(48) },
  fontFamily:
    'Jost, "Futura PT", Futura, "Avenir Next", Avenir, system-ui, -apple-system, sans-serif',
  headings: {
    fontFamily:
      'Jost, "Futura PT", Futura, "Avenir Next", Avenir, system-ui, -apple-system, sans-serif',
    fontWeight: "700",
    sizes: {
      h1: { fontSize: rem(44), fontWeight: "700", lineHeight: "1" },
      h2: { fontSize: rem(30), fontWeight: "600", lineHeight: "1.1" },
      h3: { fontSize: rem(21), fontWeight: "500", lineHeight: "1.25" },
      h4: { fontSize: rem(18), fontWeight: "500", lineHeight: "1.3" },
      h5: { fontSize: rem(16), fontWeight: "500", lineHeight: "1.4" },
      h6: { fontSize: rem(14), fontWeight: "500", lineHeight: "1.4" },
    },
  },
  components: {
    Title: Title.extend({ defaultProps: { c: "black" } }),
    Button: Button.extend({
      defaultProps: { radius: "xl", tt: "uppercase", fw: 500, lts: "0.04em" },
    }),
    Badge: Badge.extend({ defaultProps: { radius: "xl" } }),
    Card: Card.extend({ defaultProps: { withBorder: true, shadow: "none" } }),
  },
});

export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    "--mantine-color-text": brandTokens.charcoal,
    "--mantine-color-dimmed": brandTokens.muted,
    "--mantine-color-anchor": `var(--mantine-color-brand-7)`,
  },
  dark: {},
});
