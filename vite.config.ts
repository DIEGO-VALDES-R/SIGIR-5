import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
import path from "path";

export default defineConfig({
  root: path.resolve(import.meta.dirname, "client"),

  plugins: [
    react(),
    tailwindcss(),
    jsxLocPlugin(),
    vitePluginManusRuntime(),
  ],

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client/src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },

  envDir: path.resolve(import.meta.dirname),

  publicDir: path.resolve(import.meta.dirname, "client/public"),

  build: {
    outDir: path.resolve(import.meta.dirname, "client/dist"),
    emptyOutDir: true,
    sourcemap: false,
  },

  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
});
