import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import react from "eslint-plugin-react";
import tseslint from "typescript-eslint";
import prettier from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  { ignores: ["dist", "node_modules"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ["./tsconfig.json", "./tsconfig.node.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      react,
      prettier,
    },
    rules: {
      // React Hooks rules
      ...reactHooks.configs.recommended.rules,

      // React rules
      "react/prop-types": "off", // Using TypeScript for prop validation
      "react/react-in-jsx-scope": "off", // Not needed in React 17+

      // TypeScript rules - align with coding guidelines
      "@typescript-eslint/consistent-type-definitions": ["error", "type"], // Prefer type over interface
      "@typescript-eslint/no-explicit-any": "error", // Avoid any type
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // Prettier integration
      "prettier/prettier": "error",

      // General code quality
      "no-console": ["warn", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "always"],

      // Allow function declarations to be used before defined in React components
      // This is a common pattern for helper functions within components
      "@typescript-eslint/no-use-before-define": [
        "error",
        {
          functions: false,
          classes: true,
          variables: true,
          enums: true,
          typedefs: true,
        },
      ],

      // Disable exhaustive-deps warning for functions defined in component body
      // These are helper functions that don't need to be in the dependency array
      "react-hooks/exhaustive-deps": [
        "error",
        {
          enableDangerousAutofixThisMayCauseInfiniteLoops: false,
        },
      ],

      // Disable react-compiler rules (from react-hooks plugin)
      // React Compiler enforces function hoisting, but we prefer to keep helper functions
      // near where they're used for readability
      "react-compiler/react-compiler": "off",
    },
  }
);
