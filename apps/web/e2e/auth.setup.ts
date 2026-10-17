import { test as setup } from "@playwright/test";
import { ALPHA_TESTERS } from "@singology/db/admin";

import { signInAs, storageStateFor } from "./auth";

for (const who of ALPHA_TESTERS) {
  setup(`sign in as ${who}`, async ({ page }) => {
    await signInAs(page, who);
    await page.context().storageState({ path: storageStateFor(who) });
  });
}
