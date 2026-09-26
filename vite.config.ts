import { defineConfig } from 'vite';
import { aliases } from './aliases.config';

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  resolve: { alias: aliases },
  build: { target: 'es2022', chunkSizeWarningLimit: 2000 },
  define: { __BUILD_ID__: JSON.stringify(process.env.GITHUB_SHA?.slice(0, 7) ?? 'dev') },
});
