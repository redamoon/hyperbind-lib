import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  base: "/hyperbind-lib/vue/",
  plugins: [vue()],
});

