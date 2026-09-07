import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages にプロジェクトページとして公開する想定のリポジトリ名。
// 実際のリポジトリ名に合わせて変更してください。
const REPO_NAME = "kagoshima-tram-timetable";

export default defineConfig({
  base: process.env.GITHUB_PAGES === "true" ? `/${REPO_NAME}/` : "/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon-192.png", "icons/icon-512.png"],
      manifest: {
        name: "鹿児島市電 時刻表",
        short_name: "市電時刻表",
        description: "鹿児島市電の次発案内・時刻表を確認できる個人用PWA",
        lang: "ja",
        start_url: ".",
        display: "standalone",
        background_color: "#faf9f7",
        theme_color: "#1c1917",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,json}"],
        runtimeCaching: [
          {
            urlPattern: /\/data\/.*\.json$/,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "tram-data" },
          },
        ],
      },
    }),
  ],
});
