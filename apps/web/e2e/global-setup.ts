import { spawnSync } from "node:child_process";

import { assertTestEnv } from "@singology/db/admin";

// Every run starts from the fixture state, so the time-relative assertions hold within the run.
export default function globalSetup(): void {
  assertTestEnv();
  const result = spawnSync("pnpm --filter @singology/db seed", { shell: true, stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error("Seeding the test project failed.");
  }
}
