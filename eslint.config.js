import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import vue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/.vite/**",
      "docs/**",
      "examples/**",
      "pnpm-lock.yaml",
    ],
  },

  // --- 共通（JS / TS） -------------------------------------------------------
  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },

  // --- React パッケージ ------------------------------------------------------
  {
    files: ["packages/react/**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // useEffect の依存配列漏れは実バグに直結するため必ず報告させる
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  // --- Vue パッケージの .vue ファイル ----------------------------------------
  // vue-eslint-parser は .vue にのみ適用する。.ts に適用すると
  // TypeScript 構文（interface / 型注釈）が解析できなくなるため。
  ...vue.configs["flat/recommended"].map((config) => ({
    ...config,
    files: ["packages/vue/**/*.vue"],
  })),
  {
    files: ["packages/vue/**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        // <script lang="ts"> の中身は typescript-eslint のパーサに委譲する
        parser: tseslint.parser,
        ecmaVersion: "latest",
        sourceType: "module",
        extraFileExtensions: [".vue"],
      },
    },
  },

  // --- 意図的なパターンへの例外 ----------------------------------------------
  {
    // Vue 公式の *.vue シムは DefineComponent<{}, {}, any> が定型
    files: ["**/*.d.ts"],
    rules: {
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    // FormNavigator は描画を持たないレンダーレスコンポーネント
    files: ["packages/vue/src/FormNavigator.vue"],
    rules: {
      "vue/valid-template-root": "off",
    },
  },

  // --- テストファイル --------------------------------------------------------
  {
    files: ["**/*.test.{ts,tsx}", "**/__tests__/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-console": "off",
    },
  },

  // --- 設定ファイル / スクリプト ---------------------------------------------
  {
    files: ["*.config.{js,ts}", "packages/*/*.config.{js,ts}", "scripts/**/*.mjs"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-console": "off",
    },
  },

  // Prettier と衝突するフォーマット系ルールを無効化（必ず最後）
  prettier
);
