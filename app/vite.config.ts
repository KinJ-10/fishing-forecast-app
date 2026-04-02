import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api/jma-tide-text": {
        target: "https://ds.data.jma.go.jp",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/jma-tide-text/, "/gmd/kaiyou/data/db/tide/suisan/txt"),
      },
      "/api/jma-tide": {
        target: "https://ds.data.jma.go.jp",
        changeOrigin: true,
        secure: true,
        rewrite: () => "/gmd/kaiyou/db/tide/suisan/suisan.php",
      },
    },
  },
});
