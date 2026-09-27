import { decodeGrid } from './grid';
import type { Raster } from './raster';

/**
 * The placeholder bitmap font. Glyphs are text grids ('#' ink, '.' empty), 7 rows for capitals and
 * digits, 9 when they have a descender. Every glyph sits in an 11-row cell: two rows on top hold accents
 * over capitals, lowercase accents use the two rows above the x-height. Ink is white; the shell tints.
 */
export const FONT_HEIGHT = 11;
/** Baseline-to-baseline distance. */
export const LINE_HEIGHT = 12;
/** Gap between glyphs. */
const TRACKING = 1;
const SPACE_ADVANCE = 4;

/** Base glyphs, rows joined by '|'. */
const BASE: Readonly<Record<string, string>> = {
  A: '.###.|#...#|#...#|#####|#...#|#...#|#...#',
  B: '####.|#...#|#...#|####.|#...#|#...#|####.',
  C: '.###.|#...#|#....|#....|#....|#...#|.###.',
  D: '####.|#...#|#...#|#...#|#...#|#...#|####.',
  E: '#####|#....|#....|####.|#....|#....|#####',
  F: '#####|#....|#....|####.|#....|#....|#....',
  G: '.###.|#...#|#....|#.###|#...#|#...#|.####',
  H: '#...#|#...#|#...#|#####|#...#|#...#|#...#',
  I: '###|.#.|.#.|.#.|.#.|.#.|###',
  J: '..###|...#.|...#.|...#.|#..#.|#..#.|.##..',
  K: '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#',
  L: '#....|#....|#....|#....|#....|#....|#####',
  M: '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#',
  N: '#...#|##..#|#.#.#|#..##|#...#|#...#|#...#',
  O: '.###.|#...#|#...#|#...#|#...#|#...#|.###.',
  P: '####.|#...#|#...#|####.|#....|#....|#....',
  Q: '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#',
  R: '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
  S: '.####|#....|#....|.###.|....#|....#|####.',
  T: '#####|..#..|..#..|..#..|..#..|..#..|..#..',
  U: '#...#|#...#|#...#|#...#|#...#|#...#|.###.',
  V: '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..',
  W: '#...#|#...#|#...#|#.#.#|#.#.#|##.##|#...#',
  X: '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
  Y: '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..',
  Z: '#####|....#|...#.|..#..|.#...|#....|#####',
  Æ: '.####|#.#..|#.#..|#####|#.#..|#.#..|#.###',
  Ø: '.###.|#..##|#.#.#|#.#.#|#.#.#|##..#|.###.',
  Ð: '####.|.#..#|.#..#|###.#|.#..#|.#..#|####.',
  Þ: '#....|####.|#...#|#...#|####.|#....|#....',
  Ǫ: '.###.|#...#|#...#|#...#|#...#|#...#|.###.|..#..|...#.',
  a: '.....|.....|.###.|....#|.####|#...#|.####',
  b: '#....|#....|####.|#...#|#...#|#...#|####.',
  c: '....|....|.###|#...|#...|#...|.###',
  d: '....#|....#|.####|#...#|#...#|#...#|.####',
  e: '.....|.....|.###.|#...#|#####|#....|.###.',
  f: '..##|.#..|####|.#..|.#..|.#..|.#..',
  g: '....|....|.###|#..#|#..#|#..#|.###|...#|###.',
  h: '#...|#...|###.|#..#|#..#|#..#|#..#',
  i: '#|.|#|#|#|#|#',
  ı: '.|.|#|#|#|#|#',
  j: '..#|...|..#|..#|..#|..#|..#|#.#|.#.',
  k: '#...|#...|#..#|#.#.|##..|#.#.|#..#',
  l: '##.|.#.|.#.|.#.|.#.|.#.|..#',
  m: '.....|.....|##.#.|#.#.#|#.#.#|#.#.#|#.#.#',
  n: '....|....|###.|#..#|#..#|#..#|#..#',
  o: '.....|.....|.###.|#...#|#...#|#...#|.###.',
  p: '....|....|###.|#..#|#..#|#..#|###.|#...|#...',
  q: '....|....|.###|#..#|#..#|#..#|.###|...#|...#',
  r: '....|....|#.##|##..|#...|#...|#...',
  s: '....|....|.###|#...|.##.|...#|###.',
  t: '.#..|.#..|####|.#..|.#..|.#..|..##',
  u: '....|....|#..#|#..#|#..#|#..#|.###',
  v: '.....|.....|#...#|#...#|#...#|.#.#.|..#..',
  w: '.....|.....|#...#|#...#|#.#.#|#.#.#|.#.#.',
  x: '....|....|#..#|#..#|.##.|#..#|#..#',
  y: '....|....|#..#|#..#|#..#|#..#|.###|...#|###.',
  z: '....|....|####|...#|..#.|.#..|####',
  æ: '......|......|.####.|...#.#|.#####|#..#..|.##.##',
  ø: '.....|.....|.###.|#..##|#.#.#|##..#|.###.',
  ð: '..#.#|...#.|..#.#|.####|#...#|#...#|.###.',
  þ: '#...|#...|###.|#..#|#..#|#..#|###.|#...|#...',
  ǫ: '.....|.....|.###.|#...#|#...#|#...#|.###.|..#..|...#.',
  '0': '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.',
  '1': '..#..|.##..|..#..|..#..|..#..|..#..|.###.',
  '2': '.###.|#...#|....#|...#.|..#..|.#...|#####',
  '3': '####.|....#|....#|.###.|....#|....#|####.',
  '4': '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.',
  '5': '#####|#....|####.|....#|....#|#...#|.###.',
  '6': '.###.|#....|#....|####.|#...#|#...#|.###.',
  '7': '#####|....#|...#.|..#..|.#...|.#...|.#...',
  '8': '.###.|#...#|#...#|.###.|#...#|#...#|.###.',
  '9': '.###.|#...#|#...#|.####|....#|....#|.###.',
  '!': '#|#|#|#|#|.|#',
  '"': '#.#|#.#|...|...|...|...|...',
  '#': '.#.#.|.#.#.|#####|.#.#.|#####|.#.#.|.#.#.',
  $: '..#..|.####|#.#..|.###.|..#.#|####.|..#..',
  '%': '##..#|##.#.|...#.|..#..|.#...|.#.##|#..##',
  '&': '.##..|#..#.|#.#..|.#...|#.#.#|#..#.|.##.#',
  "'": '#|#|.|.|.|.|.',
  '(': '.#|#.|#.|#.|#.|#.|.#',
  ')': '#.|.#|.#|.#|.#|.#|#.',
  '*': '.....|..#..|#.#.#|.###.|#.#.#|..#..|.....',
  '+': '.....|..#..|..#..|#####|..#..|..#..|.....',
  ',': '..|..|..|..|..|.#|.#|#.',
  '-': '....|....|....|####|....|....|....',
  '.': '.|.|.|.|.|.|#',
  '/': '....#|...#.|...#.|..#..|.#...|.#...|#....',
  ':': '.|.|#|.|.|.|#',
  ';': '..|..|.#|..|..|.#|.#|#.',
  '<': '...#|..#.|.#..|#...|.#..|..#.|...#',
  '=': '....|....|####|....|####|....|....',
  '>': '#...|.#..|..#.|...#|..#.|.#..|#...',
  '?': '.###.|#...#|....#|...#.|..#..|.....|..#..',
  '@': '.###.|#...#|#.###|#.#.#|#.##.|#....|.###.',
  '[': '##|#.|#.|#.|#.|#.|##',
  '\\': '#....|.#...|.#...|..#..|...#.|...#.|....#',
  ']': '##|.#|.#|.#|.#|.#|##',
  '^': '.#.|#.#|...|...|...|...|...',
  _: '.....|.....|.....|.....|.....|.....|.....|#####',
  '`': '#.|.#|..|..|..|..|..',
  '{': '..#|.#.|.#.|#..|.#.|.#.|..#',
  '|': '#|#|#|#|#|#|#',
  '}': '#..|.#.|.#.|..#|.#.|.#.|#..',
  '~': '.....|.....|.#..#|#.#.#|#..#.|.....|.....',
  '’': '#|#|.|.|.|.|.',
  '‘': '#|#|.|.|.|.|.',
  '“': '#.#|#.#|...|...|...|...|...',
  '”': '#.#|#.#|...|...|...|...|...',
  '–': '....|....|....|####|....|....|....',
  '—': '......|......|......|######|......|......|......',
  '…': '.....|.....|.....|.....|.....|.....|#.#.#',
  '·': '.|.|.|#|.|.|.',
  '←': '.....|..#..|.#...|#####|.#...|..#..|.....',
  '→': '.....|..#..|...#.|#####|...#.|..#..|.....',
  '↑': '..#..|.###.|#.#.#|..#..|..#..|..#..|..#..',
  '↓': '..#..|..#..|..#..|#.#.#|.###.|..#..|.....',
};

/** Accent marks, two rows each. */
const ACCENT: Readonly<Record<'acute' | 'diaeresis' | 'ring', string>> = {
  acute: '.#|#.',
  diaeresis: '#.#|...',
  ring: '.#.|#.#',
};

/** Accented letters: base glyph plus a mark above it. */
const COMPOSED: Readonly<Record<string, readonly [string, keyof typeof ACCENT]>> = {
  å: ['a', 'ring'],
  ä: ['a', 'diaeresis'],
  ö: ['o', 'diaeresis'],
  ü: ['u', 'diaeresis'],
  á: ['a', 'acute'],
  é: ['e', 'acute'],
  í: ['ı', 'acute'],
  ó: ['o', 'acute'],
  ú: ['u', 'acute'],
  ý: ['y', 'acute'],
  Å: ['A', 'ring'],
  Ä: ['A', 'diaeresis'],
  Ö: ['O', 'diaeresis'],
  Ü: ['U', 'diaeresis'],
  Á: ['A', 'acute'],
  É: ['E', 'acute'],
  Í: ['I', 'acute'],
  Ó: ['O', 'acute'],
  Ú: ['U', 'acute'],
  Ý: ['Y', 'acute'],
};

export interface Glyph {
  readonly ch: string;
  /** FONT_HEIGHT rows tall; empty for the space. */
  readonly raster: Raster;
  /** Pixels to move right after drawing this glyph. */
  readonly advance: number;
}

/** Every character the font can draw. Player-facing text must use only these. */
export const FONT_CHARSET: readonly string[] = [' ', ...Object.keys(BASE), ...Object.keys(COMPOSED)].filter(
  (ch) => ch !== 'ı',
);

const isCapital = (ch: string): boolean =>
  ch.length === 1 && ch === ch.toUpperCase() && ch !== ch.toLowerCase();

/** Places a base glyph's rows into an 11-row cell (two accent rows on top). */
function cellRows(rows: readonly string[]): string[] {
  const w = rows[0]?.length ?? 0;
  const blank = '.'.repeat(w);
  const out = [blank, blank, ...rows];
  while (out.length < FONT_HEIGHT) out.push(blank);
  return out;
}

function composedRows(base: string, accent: keyof typeof ACCENT): string[] {
  const mark = ACCENT[accent].split('|');
  const mw = mark[0]?.length ?? 0;
  const baseRows = (BASE[base] ?? '').split('|');
  const pad = Math.max(0, mw - (baseRows[0]?.length ?? 0));
  const rows = cellRows(baseRows.map((r) => r + '.'.repeat(pad)));
  const w = rows[0]?.length ?? 0;
  const left = Math.max(0, Math.floor((w - mw) / 2));
  const top = isCapital(base) ? 0 : 2;
  mark.forEach((m, dy) => {
    const r = rows[top + dy] ?? '';
    rows[top + dy] = r.slice(0, left) + m + r.slice(left + m.length);
  });
  return rows;
}

const PAL = { '#': '#ffffff', '.': null };

let cache: Map<string, Glyph> | null = null;

/** All glyphs, keyed by character. */
export function glyphMap(): ReadonlyMap<string, Glyph> {
  if (cache !== null) return cache;
  const map = new Map<string, Glyph>();
  map.set(' ', { ch: ' ', raster: decodeGrid(cellRows(['.']), PAL), advance: SPACE_ADVANCE });
  for (const [ch, rows] of Object.entries(BASE)) {
    if (ch === 'ı') continue;
    const raster = decodeGrid(cellRows(rows.split('|')), PAL);
    map.set(ch, { ch, raster, advance: raster.w + TRACKING });
  }
  for (const [ch, [base, accent]] of Object.entries(COMPOSED)) {
    const raster = decodeGrid(composedRows(base, accent), PAL);
    map.set(ch, { ch, raster, advance: raster.w + TRACKING });
  }
  cache = map;
  return map;
}

export function glyphs(): Glyph[] {
  return [...glyphMap().values()];
}

/** Width in pixels of a single line (unknown characters count as '?'). */
export function textWidth(text: string): number {
  const map = glyphMap();
  let w = 0;
  for (const ch of text) w += (map.get(ch) ?? map.get('?'))?.advance ?? 0;
  return Math.max(0, w - TRACKING);
}

/** Characters of `text` the font cannot draw. */
export function unknownChars(text: string): string[] {
  const map = glyphMap();
  return [...new Set(Array.from(text).filter((ch) => ch !== '\n' && !map.has(ch)))];
}

/** Word-wraps text into lines no wider than `maxW`; `\n` forces a break. Over-long words are kept whole. */
export function layoutText(text: string, maxW: number): string[] {
  const lines: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const next = line === '' ? word : `${line} ${word}`;
      if (line !== '' && textWidth(next) > maxW) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    lines.push(line);
  }
  return lines;
}
