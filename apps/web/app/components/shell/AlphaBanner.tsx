import { Alert } from "@mantine/core";

/** Shown on every page except the landing page. */
export function AlphaBanner() {
  return (
    <Alert variant="light" color="yellow" py="xs" mb="md" data-testid="alpha-banner">
      Alpha test with real data. Tell the CTO about anything odd.
    </Alert>
  );
}
