const expoConfig = require("eslint-config-expo/flat");
const { defineConfig } = require("eslint/config");
const globals = require("globals");

module.exports = defineConfig([
  {
    ignores: [
      "**/node_modules/**",
      ".expo/**",
      "dist/**",
      "dist-web/**",
      "coverage/**",
      ".cursor/**",
      "assets/**",
      "*.config.js",
    ],
  },
  expoConfig,
  {
    files: ["**/__tests__/**/*.{js,jsx}", "**/*.test.{js,jsx,ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
]);
