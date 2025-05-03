import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'], 
    esbuildOptions: {
      // Needed for pdf.js web worker
      define: {
        global: 'globalThis',
      },
    },
  },
  server: {
    fs: {
      // Allow serving files from parent directories
      allow: ['..']
    },
    host: true, // Listen on all addresses
    port: 3000,
  },
  // Register API handlers directly without proxying
  appType: 'spa',
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'esnext'
  },
  // Use history API fallback for SPA routing
  preview: {
    port: 3000
  },
});