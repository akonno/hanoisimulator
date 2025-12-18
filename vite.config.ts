import { defineConfig } from "vite";
import vue from '@vitejs/plugin-vue';
import { resolve } from "node:path";

export default defineConfig({
    plugins: [vue()],
  root: resolve(__dirname, "src"),
  publicDir: resolve(__dirname, "public"),
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, "src/index.html"),
        about: resolve(__dirname, "src/about.html"),
        instructors: resolve(__dirname, "src/for-instructors.html"),
      },
    },
  },
});
