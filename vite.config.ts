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

  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Help Vite pre-bundle highlight.js for faster dev and to avoid resolution issues
  optimizeDeps: {
    include: ["highlight.js"],
  },

  // Build-time hints: usually not needed but left here for easy tweaks
  build: {
    rollupOptions: {
      // If you *want* to externalize a module (not recommended for css from node_modules),
      // add it here. e.g. external: ['some-module']
      // external: []
    },

    // optional: increase asset inlining limit if you embed small svgs/fonts
    // assetsInlineLimit: 4096,
  },

  // If you use SSR later and have issues bundling highlight.js, uncomment this:
  // ssr: { noExternal: ['highlight.js'] },
}));
