import { test as setup } from "@playwright/test";

import { signInAs, storageStateFor } from "./auth";

for (const who of ["founder", "cto"] as const) {
  setup(`sign in as the ${who}`, async ({ page }) => {
    await signInAs(page, who);
    await page.context().storageState({ path: storageStateFor(who) });
  });
}
