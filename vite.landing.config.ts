import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const rootDir = dirname(fileURLToPath(import.meta.url));
const base = process.env.QUODEX_BASE || "/windows/";

export default defineConfig({
  root: resolve(rootDir, "src/landing"),
  base,
  publicDir: resolve(rootDir, "public"),
  plugins: [tailwindcss(), viteReact()],
  resolve: {
    alias: {
      "@": resolve(rootDir, "src"),
    },
  },
  build: {
    outDir: resolve(rootDir, "dist"),
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
  },
});
