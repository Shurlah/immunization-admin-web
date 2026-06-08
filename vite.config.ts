import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'https://hospital-app-production-a073.up.railway.app',
      '/health': 'https://hospital-app-production-a073.up.railway.app'
    }
  }
});
