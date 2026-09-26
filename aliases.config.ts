import { fileURLToPath } from 'node:url';

const dir = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

/** Import aliases shared by Vite and Vitest. Keep in sync with `paths` in tsconfig.base.json. */
export const aliases = {
  '@core': dir('./src/core'),
  '@content': dir('./src/content'),
  '@art': dir('./src/art'),
  '@shell': dir('./src/shell'),
};
