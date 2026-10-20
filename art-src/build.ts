import { mkdirSync, writeFileSync } from 'node:fs';
import { buildAtlas } from './lib/atlas';
import { previewSheet } from './lib/preview';
import { heroFrames as placeholderHero } from '@art/sprites/hero';
import { peopleFrames as placeholderPeople } from '@art/sprites/people';
import { askdalrDecor, askdalrSheets, sheetImage } from './askdalr/build';
import { myrkvidrDecor, myrkvidrSheets } from './myrkvidr/build';
import { myrlandDecor, myrlandSheets } from './myrland/build';
import { decorFrames as placeholderDecor } from '@art/sprites/decor';
import { peopleFrames } from './people/build';
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
const SETS: readonly {
  key: string;
  frames: DrawnFrame[];
  pageSize?: number;
  placeholder: () => DrawnFrame[];
}[] = [
  {
    key: 'hero',
    frames: Object.entries(KITS).flatMap(([art, kit]) => heroFrames(art, kit)),
    placeholder: () =>
      placeholderHero().map((f) => ({ name: f.name, raster: f.raster, pivot: { x: 0, y: 0 } })),
  },
  {
    key: 'people',
    frames: peopleFrames(),
    pageSize: 2048,
    placeholder: () =>
      placeholderPeople().map((f) => ({ name: f.name, raster: f.raster, pivot: { x: 0, y: 0 } })),
  },
  {
    key: 'decor',
    frames: [...askdalrDecor(), ...myrkvidrDecor(), ...myrlandDecor()],
    placeholder: () => {
      const drawn = new Set([...askdalrDecor(), ...myrkvidrDecor(), ...myrlandDecor()].map((f) => f.name));
      return placeholderDecor()
        .filter((f) => drawn.has(f.name))
        .map((f) => ({ name: f.name, raster: f.raster, pivot: { x: 0, y: 0 } }));
    },
  },
];

const animKey = (name: string): string => name.replace(/_[a-z]_\d+$/, '');
const ofAnim = (frames: readonly DrawnFrame[], key: string): DrawnFrame[] =>
  frames.filter((f) => f.name.startsWith(`${key}_`) && /_[a-z]_\d+$/.test(f.name.slice(key.length)));

for (const set of SETS) {
  const atlas = buildAtlas(`${set.key}.png`, set.frames, set.pageSize);
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
  // One sheet of everyone standing, for a quick look at the whole cast.
  if (set.key === 'people') {
    const cast = (frames: readonly DrawnFrame[]): DrawnFrame[] =>
      frames.filter((f) => /_idle_s_0$/.test(f.name));
    writeFileSync(`${previewDir}/people_cast.png`, previewSheet(cast(set.frames), 4, 14));
    writeFileSync(`${previewDir}/old_people_cast.png`, previewSheet(cast(old), 4, 14));
  }
}

// Tile sheets, one PNG per terrain under public/atlases/<region>/.
const sheets = [
  ...askdalrSheets().map((sheet) => ({ ...sheet, dir: 'askdalr' })),
  ...myrkvidrSheets().map((sheet) => ({ ...sheet, dir: 'myrkvidr' })),
  ...myrlandSheets().map((sheet) => ({ ...sheet, dir: 'myrland' })),
];
for (const sheet of sheets) {
  mkdirSync(`public/atlases/${sheet.dir}`, { recursive: true });
  writeFileSync(`public/atlases/${sheet.dir}/${sheet.terrain}.png`, encodePng(sheetImage(sheet.cells)));
}
console.log(`tiles: ${String(sheets.length)} sheets`);
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
