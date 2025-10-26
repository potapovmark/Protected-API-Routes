import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: './client',
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
  },
  server: {
    port: 3001,
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
});
