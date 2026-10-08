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
  /** A Norn-thread: a hank of shining thread wound on a little spindle. */
  norn_thread: [
    '...w....',
    '..sus...',
    '.suSus..',
    '.sSuSs..',
    '.suSus..',
    '..sus...',
    '...w....',
    '...w.uu.',
  ],
  fen_moss: ['........', '..v..v..', '.vVvvVv.', 'vvVvvvVv', 'VvvVvVvv', '.vVvvvV.', '..VvvV..', '........'],
  /** A torn leaf of parchment, a rune scratched on it. */
  rune_leaf: ['.sssss..', '.sSssss.', 'ssuSsss.', 'ssuussSs', 'sSsusss.', '.ssuSss.', '.sssss..', '..s.s...'],
  /** An old clasp of ring-mail, its rings dark with age. */
  mail_clasp: [
    '..llll..',
    '.lLllLl.',
    'lLgggLLl',
    'lLgGgLLl',
    'lLgggLLl',
    '.lLllLl.',
    '..llll..',
    '........',
  ],
  /** A gold ring from a barrow, cold and greenish. */
  grave_ring: [
    '........',
    '..gggg..',
    '.gGvvGg.',
    '.gv..vg.',
    '.gv..vg.',
    '.gGvvGg.',
    '..gggg..',
    '........',
  ],
  /** A dripping piece of honeycomb. */
  honey: ['........', '.yyyyyy.', 'yYyYyYyy', 'yyYyYyYy', 'yYyYyYyy', '.yyyyyy.', '...Y....', '...Y....'],
  /** A lump of amber, warm-gold. */
  amber: ['........', '...yy...', '..yYYy..', '.yYyyYy.', '.yyYyyY.', '..YyyY..', '...YY...', '........'],
  /** A bronze sheep's bell on its leather strap. */
  trade_bell: [
    '.wwwww..',
    'w.....w.',
    '..ggg...',
    '.gGGgg..',
    '.gGggg..',
    'gGgggGg.',
    'ggggggg.',
    '...e....',
  ],
  /** A rolled fleece, raw and grey-white. */
  trade_fleece: [
    '........',
    '..ssss..',
    '.sSssSs.',
    'ssssSsss',
    'sSssssSs',
    'ssSssSss',
    '.ssssss.',
    '........',
  ],
  /** A skein of spun yarn. */
  trade_yarn: [
    '........',
    '.bbbbbb.',
    'bBbBbBbb',
    'bbBbBbBb',
    'bBbBbBbb',
    'bbBbBbBb',
    '.bbbbbb.',
    '........',
  ],
  /** A curved hook of old bone. */
  trade_hook: [
    '....ss..',
    '...s..s.',
    '......s.',
    '......s.',
    '.s....s.',
    '.ss..s..',
    '..sss...',
    '........',
  ],
  /** An Ís rune-stave: a short ash stave with frost-blue runes cut down it. */
  stave_is: ['......w.', '.....wk.', '....wW..', '...kw...', '..wW....', '.kw.....', 'wW......', 'w.......'],
  /** A comb of walrus ivory, its back carved. */
  trade_comb: [
    '........',
    '.ssssss.',
    'sSssSssS',
    'ssssssss',
    's.s.s.s.',
    's.s.s.s.',
    's.s.s.s.',
    '........',
  ],
  /** A curved bone sail-needle with a thread through its eye. */
  trade_needle: [
    '......s.',
    '.....sSs',
    '....s.s.',
    '...s....',
    '..s.....',
    '.sw.....',
    'sw......',
    'w.......',
  ],
  /** The dwarf hammer: a squat iron head on a short haft. */
  hammer: ['.LLLLLL.', 'LllllllL', 'LLLLLLLL', '...ww...', '...ww...', '...wW...', '...wW...', '...WW...'],
  /** The ice mirror: a round pane of clear rime in a rim of steel, a glint across it, on a short grip. */
  mirror: ['.LLLLL..', 'LlkkllL.', 'LkllkkL.', 'LklkkkL.', 'LlkkkKL.', '.LLLLL..', '...ww...', '...WW...'],
  /** A Skjálfti rune-stave: a short ash stave with ember runes cut down it. */
  stave_skjalfti: [
    '......w.',
    '.....wy.',
    '....wW..',
    '...yw...',
    '..wW....',
    '.yw.....',
    'wW......',
    'w.......',
  ],
  /** A round lens of dwarf-glass in a brass rim, light caught in it. */
  trade_lens: [
    '..bbbb..',
    '.bkkkkb.',
    'bkklkkkb',
    'bklkkkkb',
    'bkkkkkKb',
    'bkkkkKKb',
    '.bKKKKb.',
    '..bbbb..',
  ],
  /** A lump of black ore, glints of metal in it. */
  ore: ['........', '..LLL...', '.LeLlL..', 'LeLLLeL.', 'LLlLeLL.', '.LeLLL..', '..LLL...', '........'],
  /** A round iron bomb, its fuse spitting sparks. */
  bombs: ['.....y.y', '......Y.', '....ww..', '..iiii..', '.iliiii.', '.iiiiii.', '.iiiiiL.', '..iiLL..'],
  /** A short hunting bow, strung. */
  bow: ['..ww....', '.w..l...', 'w...l...', 'w...l...', 'w...l...', 'w...l...', '.w..l...', '..ww....'],
  /** Three arrows, fletched. */
  arrows: ['.....l.l', '......l.', '.....w.w', '....w.w.', '...w.w..', '..w.w...', '.ss.s...', 'ss......'],
  /** A leather quiver full of arrows. */
  quiver: ['..s.s.s.', '..w.w.w.', '.WWWWWW.', '.WwwwwW.', '.WwwwwW.', '.WwwwwW.', '.WwwwwW.', '..WWWW..'],
  /** A coil of iron chain with its hook. */
  grapple: ['.....l.l', '......Ll', '.....lL.', '.LlLl...', 'L....L..', 'l....l..', 'L....L..', '.lLlL...'],
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

/** A bundle of arrows lying where it dropped, bobbing a pixel (`pickup_arrows`). */
export function arrowPickupFrames(): SpriteFrame[] {
  const grid = ICONS.arrows ?? [];
  return [0, 1].map((bob) => {
    const g = decodeGrid(grid, ICON_PAL);
    const r = createRaster(g.w + 2, g.h + 3);
    blit(r, g, 1, 1 + bob);
    const done = outline(r, hex(C.ink), 1);
    return { name: `pickup_arrows_idle_s_${bob}`, raster: done, ox: Math.floor(done.w / 2), oy: done.h - 1 };
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
  /** The arm-ring of stamina: a green stone. */
  ring_stamina: [
    '........',
    '..bbbb..',
    '.b.vv.b.',
    'b..vv..b',
    'b......b',
    '.b....b.',
    '..bbbb..',
    '........',
  ],
  /** The arm-ring of thrift: a silver stone. */
  ring_thrift: [
    '........',
    '..bbbb..',
    '.b.ll.b.',
    'b..ll..b',
    'b......b',
    '.b....b.',
    '..bbbb..',
    '........',
  ],
  /** The arm-ring of the beacon: an ember. */
  ring_beacon: [
    '........',
    '..bbbb..',
    '.b.yy.b.',
    'b..yy..b',
    'b......b',
    '.b....b.',
    '..bbbb..',
    '........',
  ],
  /** The arm-ring of the berserker: a blood-red stone. */
  ring_berserker: [
    '........',
    '..bbbb..',
    '.b.rr.b.',
    'b..rr..b',
    'b......b',
    '.b....b.',
    '..bbbb..',
    '........',
  ],
  /** Farvegr: a path of runes winding to a standing stone. */
  galdr_farvegr: [
    '......i.',
    '.....iui',
    '.....iii',
    '...u.iii',
    '..u..iii',
    '.u...iii',
    'u..u....',
    '.uu.....',
  ],
  /** Bragð: a blade with its beam flying off the point. */
  galdr_bragd: [
    '.....u.u',
    '......uu',
    '.....luu',
    '....lL..',
    '.g.lL...',
    '..gL....',
    '.wgg....',
    'W.......',
  ],
  /** Hlíf: a ring of runes. */
  galdr_hlif: [
    '..u.uu..',
    '.u....u.',
    'u......u',
    'u......u',
    '.......u',
    'u......u',
    '.u....u.',
    '..uu.u..',
  ],
  /** Ljós: a light with rays all round it. */
  galdr_ljos: [
    'y...y..y',
    '.y..y.y.',
    '..bbbb..',
    'yybYYbyy',
    '..bYYb..',
    '..bbbb..',
    '.y..y.y.',
    'y...y..y',
  ],
  /** Vindr: three curling streaks of wind. */
  galdr_vindr: [
    '........',
    'lllll.L.',
    '.....ll.',
    '.LLLLLL.',
    '.......L',
    'lllll.L.',
    '.....l..',
    '........',
  ],
  /** Ís: a six-armed frost star. */
  galdr_is: ['...k....', '.k.k.k..', '..kkk...', 'kkk.kkk.', '..kkk...', '.k.k.k..', '...k....', '........'],
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
  out.push(...arrowPickupFrames());
  return out;
}

const ONE: AnimDef = { frames: 1, fps: 1, loop: true, dirs: ['s'] };

export const UI_ANIMS: Readonly<Record<string, Readonly<Record<string, AnimDef>>>> = {
  ui_heart: { idle: { frames: 5, fps: 1, loop: false, dirs: ['s'] } },
  ui_silver: { idle: ONE },
  ...Object.fromEntries(Object.keys(ICONS).map((item) => [`item_${item}`, { idle: ONE }])),
  ...Object.fromEntries(Object.keys(GEAR_ICONS).map((name) => [name, { idle: ONE }])),
  pickup_bombs: { idle: { frames: 2, fps: 2, loop: true, dirs: ['s'] } },
  pickup_arrows: { idle: { frames: 2, fps: 2, loop: true, dirs: ['s'] } },
};
