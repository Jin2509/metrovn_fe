import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: {
    port: 3000,
    // Backend chỉ cho phép origin cổng 3000: nhảy sang cổng khác sẽ bị CORS chặn mọi API.
    strictPort: true,
    // API được gọi từ trình duyệt nên log `[API]` chỉ nằm ở console trình duyệt: chuyển về terminal.
    forwardConsole: { unhandledErrors: true, logLevels: ["info", "warn", "error"] },
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tailwindcss(),
    tanstackStart({
      server: { entry: "server" },
    }),
    // Build ra server Node.js độc lập tại .output/server/index.mjs
    nitro({
      preset: "node-server",
      // Nén sẵn gzip/brotli lúc build: giảm dung lượng tải khoảng 3 lần, không tốn CPU lúc chạy.
      compressPublicAssets: true,
    }),
    viteReact(),
  ],
});
