import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier/flat";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/build/**",
      "**/dist/**",
      "**/.react-router/**",
      "**/.wrangler/**",
      "**/test-results/**",
      "**/playwright-report/**",
      "**/worker-configuration.d.ts",
      ".playwright-mcp/**",
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      ...reactHooks.configs.flat.recommended.rules,
      "react-hooks/exhaustive-deps": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-ignore": "allow-with-description",
          "ts-expect-error": "allow-with-description",
          minimumDescriptionLength: 5,
        },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  // Spec decision 61: the RLS-bypassing client is imported only by webhook resource routes, the
  // media job, the notification sender and the seed, so every privileged call is visible in review.
  {
    files: ["apps/**/*.{ts,tsx}", "jobs/**/*.ts", "packages/**/*.ts"],
    ignores: [
      "apps/web/app/routes/api.*",
      "apps/web/workers/notifications/**",
      "jobs/media/**",
      "packages/db/src/admin.ts",
      "packages/db/src/seed/**",
      "packages/db/test/**",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@singology/db/admin",
              message: "adminDb bypasses RLS: only webhook routes, jobs and the seed may use it.",
            },
          ],
          patterns: [
            {
              group: ["**/client"],
              importNames: ["createAdminDb"],
              message: "adminDb bypasses RLS: import it from @singology/db/admin where allowed.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.{js,cjs,mjs}"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  prettierConfig,
);
