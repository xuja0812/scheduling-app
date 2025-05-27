// vite.config.ts or vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  server: {
    origin: 'http://localhost:5174', // Vite's own dev server origin
    cors: {
      origin: 'http://localhost:5174',
      credentials: true,
    }
  }
});
