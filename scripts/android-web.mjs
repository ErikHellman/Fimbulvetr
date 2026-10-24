// Copies the production web build (dist/) into the Android TV app's assets, where MainActivity serves it.
import { cpSync, existsSync, rmSync } from 'node:fs';

const target = 'android/app/src/main/assets/web';
if (!existsSync('dist/index.html')) {
  console.error('No dist/index.html: run `pnpm build` first.');
  process.exit(1);
}
rmSync(target, { recursive: true, force: true });
cpSync('dist', target, { recursive: true });
console.log(`web build copied to ${target}`);
