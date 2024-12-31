import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'src/admin/client',
  build: {
    outDir: path.resolve(__dirname, 'dist/admin'),
    emptyOutDir: true
  }
}); 