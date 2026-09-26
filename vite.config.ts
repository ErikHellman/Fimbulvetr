import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { aliases } from './aliases.config';

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  resolve: { alias: aliases },
  build: { target: 'es2022', chunkSizeWarningLimit: 2000 },
  define: { __BUILD_ID__: JSON.stringify(process.env.GITHUB_SHA?.slice(0, 7) ?? 'dev') },
  plugins: [
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'Fimbulvetr',
        short_name: 'Fimbulvetr',
        description: 'A Norse action-adventure that runs in your browser.',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'landscape',
        background_color: '#000000',
        theme_color: '#1b1522',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,webmanifest}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
