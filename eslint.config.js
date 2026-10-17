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
      // Reference material, including a copied design system, not project code.
      "notes/**",
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
  // adminDb is imported only from the sites below, so every privileged call is visible in review.
  {
    files: ["apps/**/*.{ts,tsx}", "jobs/**/*.ts", "packages/**/*.ts"],
    ignores: [
      "apps/web/app/routes/api.*",
      "jobs/media/**",
      // The package that owns the factory, its seed and its database tests.
      "packages/db/**",
      // The scheduled sender; no request, no user.
      "apps/web/workers/notifications/**",
      // Test code: the e2e suite mints sign-in tokens against the test project.
      "apps/web/e2e/**",
      // Tooling run from a shell, never served by the Worker.
      "apps/web/scripts/**",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@singology/db/admin",
              message:
                "adminDb bypasses RLS: import it only from a site allowed in eslint.config.js.",
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
