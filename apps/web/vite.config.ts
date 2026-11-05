import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backend = env.KARM_API_PROXY_TARGET || "http://127.0.0.1:8787";

  return {
    plugins: [react()],
    build: {
      // The tree-shaken WebGL scene is intentionally lazy-loaded and bounded below 550 kB.
      chunkSizeWarningLimit: 550,
    },
    server: {
      proxy: {
        "/api": {
          target: backend,
          changeOrigin: true,
        },
      },
    },
  };
});
