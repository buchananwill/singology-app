import { Grid } from "@mantine/core";
import type { ReactNode } from "react";

export interface ReviewColumnsProps {
  main: ReactNode;
  side: ReactNode;
  testId?: string;
}

export function ReviewColumns({ main, side, testId }: ReviewColumnsProps) {
  return (
    <Grid gap="lg" data-testid={testId}>
      <Grid.Col span={{ base: 12, md: 7 }}>{main}</Grid.Col>
      <Grid.Col span={{ base: 12, md: 5 }}>{side}</Grid.Col>
    </Grid>
  );
}
