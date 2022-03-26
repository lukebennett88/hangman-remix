/* eslint-disable no-unused-vars */
const OFF = 0;
const WARN = 1;
const ERROR = 2;

/**
 * @type {import('@types/eslint').Linter.BaseConfig}
 */
module.exports = {
  extends: [
    "@remix-run/eslint-config",
    "@remix-run/eslint-config/node",
    "@remix-run/eslint-config/jest",
    "prettier",
  ],
  plugins: ["simple-import-sort", "import"],
  // we're using vitest which has a very similar API to jest
  // (so the linting plugins work nicely), but it we have to explicitly
  // set the jest version.
  settings: {
    jest: {
      version: 27,
    },
  },
  rules: {
    "import/first": ERROR,
    "import/newline-after-import": ERROR,
    "import/no-duplicates": ERROR,
    "simple-import-sort/exports": ERROR,
    "simple-import-sort/imports": ERROR,
  },
};
