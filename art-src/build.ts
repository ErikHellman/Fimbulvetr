import { mkdirSync, writeFileSync } from 'node:fs';
import { buildAtlas } from './lib/atlas';
import { previewSheet } from './lib/preview';
import { heroFrames as placeholderHero } from '@art/sprites/hero';
import { peopleFrames as placeholderPeople } from '@art/sprites/people';
import { askdalrSheets, sheetImage } from './askdalr/build';
import { emblaFrames } from './embla/build';
import { KITS, heroFrames } from './hero/build';
import { encodePng } from './lib/png';
import type { DrawnFrame } from './lib/sprite';
import { buildTileset } from '@art/tiles/tileset';
import type { TerrainId } from '@content/terrain';

/**
 * `pnpm art:pack` draws every hand-made sprite and tile and writes the atlases the game loads through
 * `public/atlases/manifest.json`. `pnpm art:pack --preview <dir>` also writes contact sheets for review.
 */
const previewDir = process.argv.includes('--preview')
  ? process.argv[process.argv.indexOf('--preview') + 1]
  : undefined;

mkdirSync('public/atlases', { recursive: true });

/** One atlas per set: its frames and the code-drawn placeholders for the before/after sheets. */
const SETS: readonly { key: string; frames: DrawnFrame[]; placeholder: () => DrawnFrame[] }[] = [
  {
    key: 'hero',
    frames: Object.entries(KITS).flatMap(([art, kit]) => heroFrames(art, kit)),
    placeholder: () =>
      placeholderHero().map((f) => ({ name: f.name, raster: f.raster, pivot: { x: 0, y: 0 } })),
  },
  {
    key: 'people',
    frames: emblaFrames(),
    placeholder: () =>
      placeholderPeople()
        .filter((f) => f.name.startsWith('npc_embla_'))
        .map((f) => ({ name: f.name, raster: f.raster, pivot: { x: 0, y: 0 } })),
  },
];

const animKey = (name: string): string => name.replace(/_[a-z]_\d+$/, '');
const ofAnim = (frames: readonly DrawnFrame[], key: string): DrawnFrame[] =>
  frames.filter((f) => f.name.startsWith(`${key}_`) && /_[a-z]_\d+$/.test(f.name.slice(key.length)));

for (const set of SETS) {
  const atlas = buildAtlas(`${set.key}.png`, set.frames);
  writeFileSync(`public/atlases/${set.key}.png`, atlas.png);
  writeFileSync(`public/atlases/${set.key}.json`, atlas.json);
  console.log(`${set.key}: ${String(set.frames.length)} frames`);
  if (previewDir === undefined) continue;
  mkdirSync(previewDir, { recursive: true });
  const old = set.placeholder();
  for (const key of new Set(set.frames.map((f) => animKey(f.name)))) {
    const frames = ofAnim(set.frames, key);
    writeFileSync(`${previewDir}/${key}.png`, previewSheet(frames, 6, Math.min(6, frames.length)));
    const before = ofAnim(old, key);
    if (before.length > 0)
      writeFileSync(`${previewDir}/old_${key}.png`, previewSheet(before, 6, Math.min(6, before.length)));
  }
  console.log(`preview in ${previewDir}`);
}

// Tile sheets, one PNG per terrain under public/atlases/askdalr/.
mkdirSync('public/atlases/askdalr', { recursive: true });
const sheets = askdalrSheets();
for (const sheet of sheets)
  writeFileSync(`public/atlases/askdalr/${sheet.terrain}.png`, encodePng(sheetImage(sheet.cells)));
console.log(`askdalr: ${String(sheets.length)} tile sheets`);
if (previewDir !== undefined) {
  const tileset = buildTileset();
  const asFrames = (cells: readonly import('@art/raster').Raster[], prefix: string): DrawnFrame[] =>
    cells.map((raster, i) => ({ name: `${prefix}_${String(i)}`, raster, pivot: { x: 0, y: 0 } }));
  for (const sheet of sheets) {
    writeFileSync(
      `${previewDir}/tile_${sheet.terrain}.png`,
      previewSheet(asFrames(sheet.cells, sheet.terrain), 6, 12),
    );
    const e = tileset.entries[sheet.terrain as TerrainId];
    const per = e.autotile ? 47 : e.count;
    const old: import('@art/raster').Raster[] = [];
    for (let f = 0; f < e.frames; f++)
      for (let i = 0; i < per; i++) {
        const t = tileset.tiles[e.start + f * e.count + i];
        if (t !== undefined) old.push(t);
      }
    writeFileSync(
      `${previewDir}/old_tile_${sheet.terrain}.png`,
      previewSheet(asFrames(old, sheet.terrain), 6, 12),
    );
  }
}
