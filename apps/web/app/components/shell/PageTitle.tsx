import { Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";

export interface PageTitleProps {
  title: string;
  description: ReactNode;
}

export function PageTitle({ title, description }: PageTitleProps) {
  return (
    <Stack gap={0}>
      <Title order={1}>{title}</Title>
      <Text c="dimmed">{description}</Text>
    </Stack>
  );
}
