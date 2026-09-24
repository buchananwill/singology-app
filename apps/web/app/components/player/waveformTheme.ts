import { alpha, type MantineTheme } from "@mantine/core";

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
  const brand = theme.colors.brand;
  const comment = theme.colors.orange[8];
  return {
    wave: theme.colors.gray[5],
    progress: brand[7],
    cursor: brand[9],
    loop: alpha(brand[7], 0.18),
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
