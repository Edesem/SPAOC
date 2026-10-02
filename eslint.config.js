// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      "dist/*",
      ".yarn/",
      ".expo/",
      "build/",
      "coverage/",
      "ios/",
      "android/",
    ],
  },
  {
    // Jest mocks need inline require() (jest.mock factories are hoisted above
    // imports) and are anonymous components by nature.
    files: ["**/*.test.{ts,tsx}", "**/__tests__/**", "src/test-utils/**", "jest.setup.ts"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "react/display-name": "off",
    },
  },
  {
    // TODO(#93): utils/notifications.ts calls useState at module level. It is
    // being deleted, so it is exempted here rather than edited. Remove this
    // override together with the file.
    files: ["src/utils/notifications.ts"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
    },
  },
]);
