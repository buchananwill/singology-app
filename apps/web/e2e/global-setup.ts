import { spawnSync } from "node:child_process";

// Every run starts from the fixture state, so the time-relative assertions hold within the run.
export default function globalSetup(): void {
  if (process.env.SINGOLOGY_ENV !== "test") {
    throw new Error("The e2e suite reseeds its database, so it runs only with SINGOLOGY_ENV=test.");
  }
  const result = spawnSync("pnpm --filter @singology/db seed", {
    shell: true,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error("Seeding the test project failed.");
  }
}
