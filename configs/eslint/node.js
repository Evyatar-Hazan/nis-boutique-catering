import baseConfig from "./base.js";

export default [
  ...baseConfig,
  {
    files: ["**/*.ts"],
    languageOptions: {
      globals: {
        process: "readonly",
        Buffer: "readonly"
      }
    }
  }
];
