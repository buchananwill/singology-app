import { Alert } from "@mantine/core";

/** Shown on every page except the landing page. */
export function DemoBanner() {
  return (
    <Alert variant="light" color="yellow" py="xs" mb="md" data-testid="demo-banner">
      Demo with sample data. Nothing you do here is saved.
    </Alert>
  );
}
