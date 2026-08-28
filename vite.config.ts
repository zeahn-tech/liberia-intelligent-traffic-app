import { vlyPlugin } from "@vly-ai/integrations";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { defineConfig } from "vite";

// Base path: "/" for local/Freebuff, "/liberia-intelligent-traffic-app/" for GitHub Pages
const isGHPages = process.env.DEPLOY_TARGET === "gh-pages";
const base = isGHPages ? "/liberia-intelligent-traffic-app/" : "/";

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    vlyPlugin(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      base,
      includeAssets: [
        "logo.svg",
        "favicon.ico",
      ],
      manifest: {
        name: "TrafficWatch AI — Liberia Intelligent Traffic App",
        short_name: "TrafficWatch AI",
        description:
          "AI-powered traffic monitoring, incident reporting, evidence management, and analytics platform for national police operations.",
        theme_color: "#1a1a2e",
        background_color: "#f4f2ee",
        display: "standalone",
        orientation: "any",
        scope: base,
        start_url: base,
        id: base,
        icons: [
          {
            src: `${base}logo.svg`,
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
        categories: ["police", "traffic", "government", "utilities"],
        screenshots: [],
        shortcuts: [
          {
            name: "Dashboard",
            short_name: "Dashboard",
            description: "View traffic enforcement dashboard",
            url: `${base}dashboard`,
            icons: [
              {
                src: `${base}logo.svg`,
                sizes: "any",
                type: "image/svg+xml",
              },
            ],
          },
          {
            name: "New Incident",
            short_name: "New Report",
            description: "Create a new incident report",
            url: `${base}incidents/new`,
            icons: [
              {
                src: `${base}logo.svg`,
                sizes: "any",
                type: "image/svg+xml",
              },
            ],
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/[acst]\.tile\.openstreetmap\.org\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "map-tiles",
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
          {
            urlPattern: /\.(?:js|css)$/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "static-resources",
            },
          },
        ],
      },
      // Dev options
      devOptions: {
        enabled: true,
        type: "module",
        navigateFallback: "/offline.html",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react/jsx-runtime", "react-dom", "react-dom/client"],
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router"],
          "ui-vendor": [
            "framer-motion",
            "lucide-react",
            "class-variance-authority",
          ],
          "map-vendor": ["leaflet"],
          "pwa-vendor": [
            "workbox-precaching",
            "workbox-routing",
            "workbox-strategies",
          ],
        },
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    chunkSizeWarningLimit: 1000,
    target: "esnext",
    minify: "esbuild",
  },
  optimizeDeps: {
    entries: ["index.html"],
    include: [
      "react",
      "react/jsx-runtime",
      "react-dom",
      "react-dom/client",
      "react-router",
      "framer-motion",
      "@supabase/supabase-js",
      "leaflet",
      "cmdk",
      "@radix-ui/react-popover",
      "@radix-ui/react-dialog",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-switch",
      "@radix-ui/react-progress",
      "@radix-ui/react-label",
      "@radix-ui/react-slot",
      "sonner",
      "lucide-react",
      "class-variance-authority",
      "clsx",
      "tailwind-merge",
    ],
  },
  server: {
    host: true,
    port: 5173,
    hmr: {
      overlay: false,
    },
  },
});
