import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

import { PREVIEW_PORT } from "./previewPort.ts";

export default defineConfig({
  plugins: [cloudflare({ viteEnvironment: { name: "ssr" } }), reactRouter()],
  preview: {
    port: PREVIEW_PORT,
    strictPort: true,
  },
});
