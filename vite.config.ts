import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  base: "/",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false, // Disable sourcemaps for production
    minify: 'esbuild',
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: undefined,
        // Ensure proper file extensions for JavaScript
        entryFileNames: () => {
          return `assets/index.js`;
        },
        chunkFileNames: () => {
          return `assets/[name].js`;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (ext === 'css') {
            return `assets/[name].css`;
          }
          return `assets/[name].[ext]`;
        }
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Ensure proper module resolution
  esbuild: {
    target: 'es2015',
    format: 'esm'
  }
}));