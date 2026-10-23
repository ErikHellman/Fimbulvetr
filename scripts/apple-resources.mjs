// Fills apple/Resources with what the Apple TV app ships: the rules bundle and the baked art.
// Run `pnpm port:build && pnpm port:art` first (`pnpm apple:resources` does all three).
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';

const target = 'apple/Resources';
for (const f of ['dist-port/fimbulvetr-core.js', 'dist-port/art/frames.json']) {
  if (!existsSync(f)) {
    console.error(`Missing ${f}: run \`pnpm port:build && pnpm port:art\` first.`);
    process.exit(1);
  }
}
rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync('dist-port/fimbulvetr-core.js', `${target}/fimbulvetr-core.js`);
cpSync('dist-port/art', `${target}/art`, { recursive: true });
console.log(`rules and art copied to ${target}`);
