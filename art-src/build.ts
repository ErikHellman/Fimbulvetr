import { mkdirSync, writeFileSync } from 'node:fs';
import { buildAtlas } from './lib/atlas';
import { previewSheet } from './lib/preview';
import { heroFrames as placeholderHero } from '@art/sprites/hero';
import { KITS, heroFrames } from './hero/build';

/**
 * `pnpm art:pack` draws every hand-made sprite and tile and writes the atlases the game loads through
 * `public/atlases/manifest.json`. `pnpm art:pack --preview <dir>` also writes contact sheets for review.
 */
const previewDir = process.argv.includes('--preview')
  ? process.argv[process.argv.indexOf('--preview') + 1]
  : undefined;

const hero = Object.entries(KITS).flatMap(([art, kit]) => heroFrames(art, kit));
const atlas = buildAtlas('hero.png', hero);
mkdirSync('public/atlases', { recursive: true });
writeFileSync('public/atlases/hero.png', atlas.png);
writeFileSync('public/atlases/hero.json', atlas.json);
console.log(`hero: ${String(hero.length)} frames`);

if (previewDir !== undefined) {
  mkdirSync(previewDir, { recursive: true });
  const anims = new Set(hero.map((f) => f.name.replace(/_[a-z]_\d+$/, '')));
  for (const key of anims) {
    const frames = hero.filter(
      (f) => f.name.startsWith(`${key}_`) && /_[a-z]_\d+$/.test(f.name.slice(key.length)),
    );
    writeFileSync(`${previewDir}/${key}.png`, previewSheet(frames, 6, Math.min(6, frames.length)));
  }
  // The code-drawn placeholders for the same animations, for a before/after review.
  const old = placeholderHero().map((f) => ({ name: f.name, raster: f.raster, pivot: { x: 0, y: 0 } }));
  for (const key of anims) {
    const frames = old.filter(
      (f) => f.name.startsWith(`${key}_`) && /_[a-z]_\d+$/.test(f.name.slice(key.length)),
    );
    if (frames.length > 0)
      writeFileSync(`${previewDir}/old_${key}.png`, previewSheet(frames, 6, Math.min(6, frames.length)));
  }
  console.log(`preview in ${previewDir}`);
}
