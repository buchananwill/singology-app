import { alpha, type MantineTheme } from "@mantine/core";

import { BRAND_SHADE, brandTokens } from "../../theme";

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
  const comment = theme.colors.olive[7];
  return {
    wave: brandTokens.lineStrong,
    progress: theme.colors.brand[BRAND_SHADE],
    cursor: theme.black,
    loop: alpha(brandTokens.lime100, 0.5),
    comment,
    commentMarker: {
      background: comment,
      color: theme.white,
      borderRadius: theme.radius.xl,
      fontFamily: theme.fontFamily,
      fontSize: theme.fontSizes.xs,
      fontWeight: theme.fontWeights.medium,
      lineHeight: theme.lineHeights.xs,
    },
  };
}
