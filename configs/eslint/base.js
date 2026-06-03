export default [
  {
    ignores: ["dist", "build", "node_modules", ".turbo"]
  },
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-unused-vars": "off"
    }
  }
];
