import { defineConfig } from 'vitest/config';
import { aliases } from './aliases.config';

export default defineConfig({
  resolve: { alias: aliases },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
});
