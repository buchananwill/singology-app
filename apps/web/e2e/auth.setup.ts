import { test as setup } from "@playwright/test";
import { E2E_TESTERS } from "@singology/db/admin";

import { signInAs, storageStateFor } from "./auth";

for (const who of E2E_TESTERS) {
  setup(`sign in as ${who}`, async ({ page }) => {
    await signInAs(page, who);
    await page.context().storageState({ path: storageStateFor(who) });
  });
}
