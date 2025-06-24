// vite.config.ts or vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  server: {
    origin: 'http://localhost:5173', 
    cors: {
      origin: 'http://localhost:5173',
      credentials: true,
    }
  }
});
