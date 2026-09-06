import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const identityTarget = env.VITE_IDENTITY_BASE_URL || "http://localhost:7101";
  const apiTarget      = env.VITE_API_BASE_URL      || "http://localhost:7001";

  return {
    plugins: [react()],
    server: {
      proxy: {
        // Identity server proxy — forwards /identity/* to the real identity server
        "/identity": {
          target: identityTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/identity/, ""),
          configure: (proxy) => {
            proxy.on("error", (err) => {
              console.error("[identity-proxy] error:", err.message);
            });
            proxy.on("proxyReq", (_req, req) => {
              console.log("[identity-proxy]", req.method, req.url, "→", identityTarget);
            });
          },
        },
        // API proxy — forwards /api/* to the real backend
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on("error", (err) => {
              console.error("[api-proxy] error:", err.message);
            });
          },
        },
      },
    },
  };
});
