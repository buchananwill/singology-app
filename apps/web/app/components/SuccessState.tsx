import { Alert, Box, Stack } from "@mantine/core";
import type { ReactNode } from "react";

export interface SuccessStateProps {
  title: string;
  message: string;
  testId: string;
  children: ReactNode;
}

export function SuccessState({ title, message, testId, children }: SuccessStateProps) {
  return (
    <Stack gap="sm">
      <Alert color="brand" title={title} data-testid={testId}>
        {message}
      </Alert>
      <Box>{children}</Box>
    </Stack>
  );
}
