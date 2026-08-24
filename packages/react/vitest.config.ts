import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // テストではビルド済み dist ではなく core のソースを直接参照する。
      // これにより core をビルドせずにテストでき、binder シングルトンの
      // 実体がテストコードとフック側で確実に一致する。
      "@hyperbind-lib/core": resolve(__dirname, "../core/src/index.ts"),
    },
  },
  esbuild: {
    jsx: "automatic",
  },
  test: {
    name: "react",
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    globals: false,
    restoreMocks: true,
  },
});
