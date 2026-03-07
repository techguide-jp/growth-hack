import js from "@eslint/js";
import globals from "globals";
import svelte from "eslint-plugin-svelte";
import tseslint from "typescript-eslint";

import noLegacySvelte5SyntaxRule from "./eslint/rules/no-legacy-svelte5-syntax.mjs";
import svelteConfig from "./svelte.config.js";

const localPlugin = {
  rules: {
    "no-legacy-svelte5-syntax": noLegacySvelte5SyntaxRule,
  },
};

export default [
  {
    ignores: [
      ".svelte-kit/**",
      ".vercel/**",
      "build/**",
      "dist/**",
      "coverage/**",
    ],
  },
  {
    ...js.configs.recommended,
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ...js.configs.recommended.languageOptions,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  ...svelte.configs["flat/base"],
  ...svelte.configs["flat/prettier"],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: [".svelte"],
        parser: tseslint.parser,
        svelteConfig,
      },
    },
    plugins: {
      local: localPlugin,
    },
    rules: {
      "local/no-legacy-svelte5-syntax": "error",
      "svelte/valid-compile": "error",
    },
  },
];
