import { reseedTestProject } from "@singology/db/admin";

// Every run starts from the fixture state, so the time-relative assertions hold within the run.
export default async function globalSetup(): Promise<void> {
  await reseedTestProject();
}
