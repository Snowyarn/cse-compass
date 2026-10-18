// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", "flutter_app/*", "scripts/*"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  }
]);
