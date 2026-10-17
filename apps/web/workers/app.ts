import { createRequestHandler } from "react-router";

import { MEDIA_PATH_PREFIX, serveMedia } from "./media/serveMedia";
import { runNudges } from "./notifications/runNudges";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env) {
    // `/media/*` reaches this Worker before the static-assets handler (`assets.run_worker_first`
    // in wrangler.jsonc) so it can answer HTTP Range requests; it never enters React Router.
    if (new URL(request.url).pathname.startsWith(MEDIA_PATH_PREFIX)) {
      return serveMedia(request, env.ASSETS);
    }
    return requestHandler(request);
  },
  async scheduled(controller, env) {
    await runNudges(env, controller.cron, new Date(controller.scheduledTime));
  },
} satisfies ExportedHandler<Env>;
