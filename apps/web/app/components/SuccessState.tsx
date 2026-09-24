import { Alert, Box, Stack } from "@mantine/core";
import type { ReactNode } from "react";

export interface SuccessStateProps {
  title: string;
  message: string;
  testId: string;
  /** The follow-up action under the alert, e.g. a button. */
  children: ReactNode;
}

export function SuccessState({ title, message, testId, children }: SuccessStateProps) {
  return (
    <Stack gap="sm">
      <Alert color="green" title={title} data-testid={testId}>
        {message}
      </Alert>
      <Box>{children}</Box>
    </Stack>
  );
}
