const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  { ignores: ["node_modules/**", "uploads/**", "coverage/**"] },

  js.configs.recommended,

  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: { ...globals.node },
    },
    rules: {
      // `next` is unused in Express error handlers but must stay for the 4-arg signature
      "no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^(_|next$)", caughtErrors: "none" },
      ],
      eqeqeq: ["error", "always"],
      "no-var": "error",
      "prefer-const": "warn",
      "no-console": "off", // you log server status and errors on purpose
    },
  },

  // Jest tests: allow describe / it / expect / beforeAll, etc.
  {
    files: ["tests/**/*.js"],
    languageOptions: { globals: { ...globals.jest } },
  },
];