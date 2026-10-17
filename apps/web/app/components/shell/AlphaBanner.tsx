import { Alert } from "@mantine/core";

export function AlphaBanner() {
  return (
    <Alert variant="light" color="olive" py="xs" mb="md" data-testid="alpha-banner">
      Alpha test with real data. Tell the CTO about anything odd.
    </Alert>
  );
}
