import { Box, Container, Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";

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
  return (
    <Box
      className="hero-panel"
      bg="brand.5"
      py="xl"
      mx="calc(var(--mantine-spacing-md) * -1)"
      mt="calc(var(--mantine-spacing-md) * -1)"
    >
      <Container size="md">
        <Stack component="section" gap="md" aria-labelledby="hero-title" bg="navy.7" p="xl">
          <Eyebrow c="brand.5">{eyebrow}</Eyebrow>
          <Title id="hero-title" order={1} className="display" c="white">
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
