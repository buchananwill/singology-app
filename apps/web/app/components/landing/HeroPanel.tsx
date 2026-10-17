import { Box, Container, Stack, Text, Title } from "@mantine/core";
import { type ReactNode, useId } from "react";

import { brandTokens } from "../../theme";
import { Eyebrow } from "./Eyebrow";

export interface HeroPanelProps {
  eyebrow: string;
  title: string;
  lead: string;
  aside: string;
  action: ReactNode;
}

export function HeroPanel({ eyebrow, title, lead, aside, action }: HeroPanelProps) {
  const titleId = useId();
  return (
    <Box
      className="hero-panel"
      bg="brand"
      py="xl"
      mx="calc(var(--mantine-spacing-md) * -1)"
      mt="calc(var(--mantine-spacing-md) * -1)"
    >
      <Container size="md">
        <Stack component="section" gap="md" aria-labelledby={titleId} bg="black" p="xl">
          <Eyebrow c="brand">{eyebrow}</Eyebrow>
          <Title id={titleId} order={1} className="display" c="white">
            {title}
          </Title>
          <Text size="lg" c="white">
            {lead}
          </Text>
          <Text className="voice" c={brandTokens.onStageMuted}>
            {aside}
          </Text>
          <Box>{action}</Box>
        </Stack>
      </Container>
    </Box>
  );
}
