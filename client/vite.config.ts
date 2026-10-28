import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Same-origin in development so the httpOnly session cookie and CSRF cookie just work.
    proxy: { '/api': { target: 'http://localhost:4000', changeOrigin: false } },
  },
  test: { environment: 'jsdom', globals: true, setupFiles: ['src/setupTests.ts'] },
});
