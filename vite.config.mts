import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const { VITE_DEV_PROXY_TARGET: proxyTarget } = loadEnv(
    mode,
    process.cwd(),
    "",
  );

  return {
    plugins: [react(), tailwindcss()],
    base: "/",
    server: {
      proxy: proxyTarget
        ? {
            "/api": { target: proxyTarget, changeOrigin: true },
            "/health": { target: proxyTarget, changeOrigin: true },
          }
        : undefined,
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./src/test/setup.ts",
      css: true,
    },
  };
});
