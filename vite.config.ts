import { defineConfig } from 'vite';
import { aliases } from './aliases.config';

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  resolve: { alias: aliases },
  build: { target: 'es2022', chunkSizeWarningLimit: 2000 },
});
