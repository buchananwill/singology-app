import { Text, type TextProps } from "@mantine/core";
import type { ReactNode } from "react";

export interface EyebrowProps extends Pick<TextProps, "c"> {
  children: ReactNode;
}

export function Eyebrow({ children, c = "brand.7" }: EyebrowProps) {
  return (
    <Text fz={13} fw={700} lts="0.28em" tt="uppercase" lh={1.2} c={c}>
      {children}
    </Text>
  );
}
