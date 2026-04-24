import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";
import type { Plugin } from "vite";
import viteCompression from "vite-plugin-compression";
import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
const apiPort = process.env.VITE_PROXY_PORT || "8000";
const apiTarget = `http://localhost:${apiPort}`;

export default defineConfig({
  resolve: {
    // Single React instance across chunks (pairs with manualChunks below)
    dedupe: ["react", "react-dom"],
  },
  server: {
    proxy: {
      "/api": apiTarget,
      "/api-token-auth": apiTarget,
      "/admin": apiTarget,
      "/media": apiTarget,
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["DRMISLogo.svg", "favicon.ico"],
      manifest: {
        name: "Disaster Risk Management Information System",
        short_name: "DRMIS",
        description: "Disaster Risk Management Information System",
        theme_color: "#2563EB",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "/DRMISLogo.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
        workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/[a-z0-9-]+\.basemaps\.cartocdn\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "basemap-tiles",
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/[^/]+\/.*\.pmtiles$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "pmtiles-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
    viteCompression({
      algorithm: "gzip",
      ext: ".gz",
      filter: (file) => !file.endsWith("stats.html"),
    }),
    viteCompression({
      algorithm: "brotliCompress",
      ext: ".br",
      filter: (file) => !file.endsWith("stats.html"),
    }),
    visualizer({
      filename: "dist/stats.html",
      gzipSize: true,
      brotliSize: true,
      open: false,
    }) as Plugin,
  ],
  build: {
    // Smaller main-thread parse on first paint; map still targets modern browsers.
    target: "es2022",
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            // Do NOT split maplibre-gl / pmtiles into their own chunk: that creates
            // vendor <-> map circular imports and React's createContext is undefined at runtime.
            if (id.includes("react") || id.includes("react-dom") || id.includes("scheduler") || id.includes("react-map-gl")) {
              return "react";
            }
            if (id.includes("highcharts")) {
              return "charts";
            }
            return "vendor";
          }
        },
      },
    },
  },
});
