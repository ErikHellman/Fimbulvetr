import type { ItemId } from '@content/ids';
import type { AnimDef } from '../anims';
import { rect } from '../draw';
import { decodeGrid, type GridPalette } from '../grid';
import { outline } from '../outline';
import { C } from '../palette';
import { blit, createRaster, hex, type Raster } from '../raster';
import type { SpriteFrame } from './types';

const HEART = ['.hh.hh.', 'hhhhhhh', 'hhhhhhh', 'hhhhhhh', '.hhhhh.', '..hhh..', '...h...'];

/** A heart filled by `q` quarters (0–4), read left-to-right, top-to-bottom like Zelda's. */
function heart(q: number): Raster {
  const full = hex(C.heart);
  const empty = hex(C.heartShade);
  const g = decodeGrid(HEART, { '.': null, h: C.heartShade });
  const r = createRaster(g.w + 2, g.h + 2);
  blit(r, g, 1, 1);
  for (let y = 0; y < HEART.length; y++) {
    for (let x = 0; x < 7; x++) {
      if (HEART[y]?.charAt(x) !== 'h') continue;
      const quarter = (x >= 4 ? 1 : 0) + (y >= 3 ? 2 : 0);
      const order = [0, 1, 3, 2][quarter] ?? 0;
      rect(r, x + 1, y + 1, 1, 1, order < q ? full : empty);
    }
  }
  if (q === 4) rect(r, 2, 2, 1, 1, hex(C.heartLight));
  return outline(r, hex(C.ink), 1);
}

const COIN = ['.sss.', 'sSSSs', 'sS.Ss', 'sSSSs', '.sss.'];

const ICONS: Readonly<Partial<Record<ItemId, readonly string[]>>> = {
  lantern: ['...ee...', '..e..e..', '.eeeeee.', '.eyyyye.', '.eyYYye.', '.eyYYye.', '.eyyyye.', '.eeeeee.'],
  flatbread: ['..bbbb..', '.bBbbBb.', 'bbbBbbbb', 'bBbbbbBb', 'bbbbBbbb', '.bbBbbb.', '..bbbb..', '........'],
  cheese: ['........', '....yyy.', '..yyyyy.', 'yyyyYyy.', 'yyYyyyy.', 'yyyyyYy.', 'YYYYYYY.', '........'],
  boomerang: ['wwwwww..', 'wWWWWw..', 'ww......', 'wW......', 'wW......', 'wW......', 'ww......', '........'],
  small_key: ['.gg.....', 'g..g....', 'g..g....', '.gGgggg.', '.....g.g', '.....g..', '........', '........'],
  big_key: ['.ggg....', 'g...g...', 'g.e.g...', 'g...g...', '.gggGggg', '.....gGg', '.....g.g', '........'],
  dungeon_map: [
    'ssssssss',
    'sSs.ssSs',
    'ss.sSsss',
    'sss.ssrs',
    'sSsss.ss',
    'ssSssss.',
    'ssssSsss',
    '........',
  ],
  compass: ['..iiii..', '.illlli.', 'illrllli', 'illrllli', 'illleeli', 'illleeli', '.illlli.', '..iiii..'],
  horn: ['.......s', '......sS', '.....sS.', '....ssS.', '..sssS..', '.ssSS...', 'gsS.....', 'gg......'],
  mead_red: ['.......s', '......sS', '.....rS.', '....rrS.', '..rrrS..', '.rrSS...', 'grS.....', 'gg......'],
  mead_green: [
    '.......s',
    '......sS',
    '.....vS.',
    '....vvS.',
    '..vvvS..',
    '.vvSS...',
    'gvS.....',
    'gg......',
  ],
  mead_blue: ['.......s', '......sS', '.....uS.', '....uuS.', '..uuuS..', '.uuSS...', 'guS.....', 'gg......'],
  winter_cloak: [
    '..gggg..',
    '.kkkkkk.',
    'kkKkkKkk',
    'kkKkkKkk',
    'kkKkkKkk',
    'kKkkkkKk',
    'kkkkkkkk',
    '.k.kk.k.',
  ],
  charred_stave: [
    '......eW',
    '.....eWe',
    '....eWe.',
    '...eWe..',
    '..wWe...',
    '.wWy....',
    'wWY.....',
    'W.......',
  ],
  fen_moss: ['........', '..v..v..', '.vVvvVv.', 'vvVvvvVv', 'VvvVvVvv', '.vVvvvV.', '..VvvV..', '........'],
  /** A round iron bomb, its fuse spitting sparks. */
  bombs: ['.....y.y', '......Y.', '....ww..', '..iiii..', '.iliiii.', '.iiiiii.', '.iiiiiL.', '..iiLL..'],
  /** A sack bulging with bombs. */
  bomb_bag: ['..ss....', '.sSSs...', 'ssssss..', 'sSssSs..', 'sssiiis.', 'sSsilis.', '.sssiis.', '..ssss..'],
};

/** A bundle of bombs lying where it dropped, bobbing a pixel (`pickup_bombs`). */
export function bombPickupFrames(): SpriteFrame[] {
  const grid = ICONS.bombs ?? [];
  return [0, 1].map((bob) => {
    const g = decodeGrid(grid, ICON_PAL);
    const r = createRaster(g.w + 2, g.h + 3);
    blit(r, g, 1, 1 + bob);
    const done = outline(r, hex(C.ink), 1);
    return { name: `pickup_bombs_idle_s_${bob}`, raster: done, ox: Math.floor(done.w / 2), oy: done.h - 1 };
  });
}

/** Weapons, armour and galdr for the Gear page: `gear_<id>` and `galdr_<id>`. */
const GEAR_ICONS: Readonly<Record<string, readonly string[]>> = {
  gear_none: ['........', '..sss...', '.sssss..', '.sSsSs..', '.sssss..', '..sss...', '..sS....', '........'],
  gear_pitchfork: [
    'l.l.l...',
    'l.l.l...',
    'lllll...',
    '..w.....',
    '..w.....',
    '..w.....',
    '..W.....',
    '..W.....',
  ],
  gear_handaxe: [
    '.lll....',
    'llLl....',
    'lLl.....',
    '.w......',
    '.w......',
    '.w......',
    '.W......',
    '.W......',
  ],
  gear_seax: ['......l.', '.....ll.', '....lL..', '...lL...', '..lL....', '.gg.....', 'wg......', 'W.......'],
  gear_uppvik_sword: [
    '.......l',
    '......lL',
    '.....lL.',
    '....lL..',
    '.g.lL...',
    '..gL....',
    '.wgg....',
    'W.......',
  ],
  gear_dwarf_blade: [
    '.......y',
    '......yl',
    '.....yl.',
    '....yl..',
    '.g.yl...',
    '..gl....',
    '.wgg....',
    'W.......',
  ],
  gear_wool_tunic: [
    '.s....s.',
    'ssssssss',
    '.ssSsss.',
    '.ssSsss.',
    '.ssssss.',
    '.sSsssS.',
    '.ssssss.',
    '........',
  ],
  gear_byrnie: [
    '.i....i.',
    'iiiiiiii',
    '.ilililt',
    '.lilili.',
    '.ilililt',
    '.lilili.',
    '.iiiiii.',
    '........',
  ],
  gear_ember_byrnie: [
    '.Y....Y.',
    'YYYYYYYY',
    '.YyYyYy.',
    '.yYyYyY.',
    '.YyYyYy.',
    '.yYyYyY.',
    '.YYYYYY.',
    '........',
  ],
  gear_runeplate: [
    '.i....i.',
    'iiiiiiii',
    '.iuiiui.',
    '.iiuuii.',
    '.iiuuii.',
    '.iuiiui.',
    '.iiiiii.',
    '........',
  ],
  galdr_eldr: [
    '...y....',
    '..yY....',
    '..yYy...',
    '.yYYy.y.',
    '.yYyYyY.',
    'yYyyyYYy',
    'yYYyYYYy',
    '.yyyyyy.',
  ],
};

const ICON_PAL: GridPalette = {
  '.': null,
  e: C.ink,
  y: C.emberLight,
  Y: C.ember,
  b: C.straw,
  B: C.strawShade,
  w: C.wood,
  W: C.woodShade,
  g: C.shieldRim,
  G: C.strawShade,
  s: C.sack,
  S: C.sackShade,
  r: C.heart,
  i: C.hoop,
  l: C.steel,
  L: C.steelShade,
  v: C.vine,
  V: C.vineShade,
  u: C.rune,
  k: '#3a5a8a',
  K: '#27406a',
  t: C.hoop,
};

export function uiFrames(): SpriteFrame[] {
  const out: SpriteFrame[] = [];
  for (let q = 0; q <= 4; q++) out.push({ name: `ui_heart_idle_s_${q}`, raster: heart(q), ox: 0, oy: 0 });
  const coin = decodeGrid(COIN, { '.': null, s: C.shieldRim, S: C.strawShade });
  const c = createRaster(coin.w + 2, coin.h + 2);
  blit(c, coin, 1, 1);
  out.push({ name: 'ui_silver_idle_s_0', raster: outline(c, hex(C.ink), 1), ox: 0, oy: 0 });
  const icon = (name: string, grid: readonly string[]): void => {
    const g = decodeGrid(grid, ICON_PAL);
    const r = createRaster(g.w + 2, g.h + 2);
    blit(r, g, 1, 1);
    out.push({ name: `${name}_idle_s_0`, raster: outline(r, hex(C.ink), 1), ox: 0, oy: 0 });
  };
  for (const [item, grid] of Object.entries(ICONS)) icon(`item_${item}`, grid);
  for (const [name, grid] of Object.entries(GEAR_ICONS)) icon(name, grid);
  out.push(...bombPickupFrames());
  return out;
}

const ONE: AnimDef = { frames: 1, fps: 1, loop: true, dirs: ['s'] };

export const UI_ANIMS: Readonly<Record<string, Readonly<Record<string, AnimDef>>>> = {
  ui_heart: { idle: { frames: 5, fps: 1, loop: false, dirs: ['s'] } },
  ui_silver: { idle: ONE },
  ...Object.fromEntries(Object.keys(ICONS).map((item) => [`item_${item}`, { idle: ONE }])),
  ...Object.fromEntries(Object.keys(GEAR_ICONS).map((name) => [name, { idle: ONE }])),
  pickup_bombs: { idle: { frames: 2, fps: 2, loop: true, dirs: ['s'] } },
};
