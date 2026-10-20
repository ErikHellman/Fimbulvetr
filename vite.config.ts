import { readFileSync } from 'node:fs';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { aliases } from './aliases.config';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};
const buildId = process.env.GITHUB_SHA?.slice(0, 7) ?? 'dev';

/** Source maps go to Sentry only when CI has the upload token; they are deleted from dist so the site never serves them. */
const sentryUpload = process.env.SENTRY_AUTH_TOKEN
  ? sentryVitePlugin({
      org: 'hellman-software-ab-gz',
      project: process.env.SENTRY_PROJECT ?? 'fimbulvetr',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      release: { name: `fimbulvetr@${pkg.version}+${buildId}` },
      sourcemaps: { filesToDeleteAfterUpload: ['dist/**/*.map'] },
      telemetry: false,
    })
  : null;

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  resolve: { alias: aliases },
  build: { target: 'es2022', chunkSizeWarningLimit: 2000, sourcemap: sentryUpload ? 'hidden' : false },
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
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
        globPatterns: ['**/*.{js,css,html,png,json,webmanifest}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        cleanupOutdatedCaches: true,
      },
    }),
    sentryUpload,
  ],
});
