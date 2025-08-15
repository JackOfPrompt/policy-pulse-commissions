import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
// Force restart to clear cache
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: false,
    watch: {
      usePolling: true,
    },
  },
  define: {
    __WS_TOKEN__: JSON.stringify(process.env.WS_TOKEN || ""),
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
}));
