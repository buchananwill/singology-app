import { alpha, type MantineTheme, parseThemeColor } from "@mantine/core";

import { brandTokens } from "../../theme";

export interface WaveformTheme {
  wave: string;
  progress: string;
  cursor: string;
  loop: string;
  comment: string;
  commentMarker: Partial<CSSStyleDeclaration>;
}

// wavesurfer paints on a canvas, which cannot read CSS variables, so its colours are plain values.
export function waveformTheme(theme: MantineTheme): WaveformTheme {
  const comment = parseThemeColor({ color: "olive", theme }).value;
  return {
    wave: brandTokens.lineStrong,
    progress: parseThemeColor({ color: theme.primaryColor, theme }).value,
    cursor: theme.black,
    loop: alpha(brandTokens.lime100, 0.5),
    comment,
    commentMarker: {
      background: comment,
      color: theme.black,
      borderRadius: theme.radius.xl,
      fontFamily: theme.fontFamily,
      fontSize: theme.fontSizes.xs,
      fontWeight: theme.fontWeights.medium,
      lineHeight: theme.lineHeights.xs,
    },
  };
}
