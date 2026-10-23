import { defineConfig } from 'vite';
import { aliases } from './aliases.config';

/** The pure game rules as one classic script for JavaScriptCore (no modules, no DOM). */
export default defineConfig({
  resolve: { alias: aliases },
  publicDir: false,
  build: {
    outDir: 'dist-port',
    target: 'es2022',
    minify: true,
    lib: {
      entry: 'src/port/entry.ts',
      formats: ['iife'],
      name: 'FimbulvetrCoreBundle',
      fileName: () => 'fimbulvetr-core.js',
    },
  },
});
