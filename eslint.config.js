// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

// Layering: app -> features -> shared. Shared folders never import a feature,
// features never import route files, and one feature reaches another only
// through its index.ts.
const FEATURES = ["calendar", "notifications", "parish", "prayer", "settings"];
const SHARED = [
  "components",
  "config",
  "constants",
  "domain",
  "hooks",
  "lib",
  "services",
  "theme",
  "types",
  "utils",
];
const layeringZones = [
  ...SHARED.map((dir) => ({
    target: `./src/${dir}`,
    from: "./src/features",
    message: "Shared code must not import a feature.",
  })),
  {
    target: "./src/features",
    from: "./src/app",
    message: "Features must not import route files.",
  },
  ...FEATURES.flatMap((target) =>
    FEATURES.filter((other) => other !== target).map((other) => ({
      target: `./src/features/${target}`,
      from: `./src/features/${other}`,
      except: ["./index.ts"],
      message: `Import ${other} through "@/features/${other}" (its index.ts) only.`,
    })),
  ),
];

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
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "import/no-restricted-paths": ["error", { zones: layeringZones }],
    },
  },
  {
    // The planner decides what to schedule from the data and time it is given.
    // It must not touch React, Expo, storage or the clock (docs/notification-planner.md).
    files: ["src/features/notifications/notificationPlanner.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "react",
                "react-native",
                "react-native/*",
                "expo",
                "expo-*",
                "@react-native-async-storage/*",
                "@/services/*",
              ],
              message: "The notification planner must stay pure.",
            },
          ],
          paths: [
            {
              name: "@/lib/parishTime",
              importNames: ["now"],
              message: "The planner must not read the clock; take the time as an argument.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: "The planner must not read the clock.",
        },
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message: "The planner must not read the clock.",
        },
      ],
    },
  },
  {
    // TODO(#93): re-exports a feature for utils/notifications.ts, the only
    // importer. Remove together with that file.
    files: ["src/services/notifications/index.ts"],
    rules: {
      "import/no-restricted-paths": "off",
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
