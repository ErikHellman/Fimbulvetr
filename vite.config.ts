import { readFileSync } from 'node:fs';
import { defineConfig, type PluginOption } from 'vite';
import { vakaVite } from '@hellsoft/vaka-bundler-plugin';
import { VitePWA } from 'vite-plugin-pwa';
import { aliases } from './aliases.config';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};
const buildId = process.env.GITHUB_SHA?.slice(0, 7) ?? 'dev';
const release = `${pkg.version}+${buildId}`;
// Source maps are built and uploaded to Vaka only when a token is set (the deploy job); they are deleted
// after the upload, so they are never deployed.
const vakaToken = process.env.VAKA_TOKEN;

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  resolve: { alias: aliases },
  build: { target: 'es2022', chunkSizeWarningLimit: 2000, sourcemap: vakaToken ? 'hidden' : false },
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
    __APP_VERSION__: JSON.stringify(pkg.version),
    __RELEASE__: JSON.stringify(release),
  },
  plugins: [
    ...(vakaToken
      ? [
          vakaVite({
            url: 'https://vaka.fly.dev',
            token: vakaToken,
            project: 'fimbulvetr',
            release,
            deleteAfterUpload: true,
            defineRelease: false,
          }) as PluginOption,
        ]
      : []),
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
        // The sign-in callback comes back with ?code=…, which the precache does not match; without this the
        // navigation fallback would answer it with the game itself.
        navigateFallbackDenylist: [/\/oauth-callback\.html/],
      },
    }),
  ],
});
