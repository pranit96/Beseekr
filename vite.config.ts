// vite.config.ts - Optimized for code splitting
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
        passes: 2, // Additional optimization pass
      }
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core - essential, always loaded
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          // Router - loaded for navigation
          if (id.includes('react-router')) {
            return 'router';
          }
          // Radix UI components - split by component for better tree-shaking
          if (id.includes('@radix-ui')) {
            return 'ui-vendor';
          }
          // TanStack Query - data fetching
          if (id.includes('@tanstack/react-query')) {
            return 'query';
          }
          // Framer Motion - animations
          if (id.includes('framer-motion')) {
            return 'motion';
          }
          // Markdown rendering - only needed for reports
          if (id.includes('react-markdown') || id.includes('remark') || id.includes('rehype')) {
            return 'markdown';
          }
          // Syntax highlighting - only for code blocks
          if (id.includes('react-syntax-highlighter') || id.includes('highlight.js') || id.includes('prism')) {
            return 'syntax';
          }
          // Socket.io - only for real-time features
          if (id.includes('socket.io')) {
            return 'socket';
          }
          // Lucide icons - commonly used
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          // Date/time utilities
          if (id.includes('date-fns') || id.includes('dayjs')) {
            return 'date-utils';
          }
          // Vercel analytics
          if (id.includes('@vercel')) {
            return 'vercel';
          }
        }
      }
    },
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 500, // Lower warning threshold
    reportCompressedSize: true
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'socket.io-client'
    ],
    // Exclude large optional deps from pre-bundling
    exclude: ['react-syntax-highlighter']
  }
});