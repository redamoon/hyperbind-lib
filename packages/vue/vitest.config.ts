import { resolve } from "node:path";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // テストではビルド済み dist ではなく core のソースを直接参照する。
      // これにより core をビルドせずにテストでき、binder シングルトンの
      // 実体がテストコードとコンポーザブル側で確実に一致する。
      "@hyperbind-lib/core": resolve(__dirname, "../core/src/index.ts"),
    },
  },
  test: {
    name: "vue",
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
    globals: false,
    restoreMocks: true,
  },
});
