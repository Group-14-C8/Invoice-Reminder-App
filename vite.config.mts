import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";

const localApiProxy = "http://localhost:5000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/",
  server: {
    proxy: {
      "/api": {
        target: localApiProxy,
        changeOrigin: true,
      },
      "/health": {
        target: localApiProxy,
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    css: true,
  },
});
