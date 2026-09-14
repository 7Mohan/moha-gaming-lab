import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Downgrade to warnings — these are import-cleanup issues in existing
      // tool engine files that do not affect runtime correctness.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          // Allow underscore-prefixed identifiers to be intentionally unused
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      "prefer-const": "warn",
    },
  },
];

export default eslintConfig;
