import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Browser talks to Vite on the same origin. Vite forwards Identity traffic
      // server-side, avoiding the Chrome cross-origin/chunked-response problem.
      "/identity": {
        target: "http://localhost:7101",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/identity/, ""),
      },
    },
  },
});
