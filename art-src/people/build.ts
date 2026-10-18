import type { GridPalette } from '@art/grid';
import { outline } from '@art/outline';
import { C } from '@art/palette';
import { createRaster, getPixel, hex, setPixel, type Raster } from '@art/raster';
import { LOOKS, type Look } from '@art/sprites/people';
import { frame, mirror, paste, type DrawnFrame } from '../lib/sprite';
import { HEAD_TEXT, LEGS_TEXT, TORSO_TEXT, render } from '../hero/parts';
import {
  APRON_TEXT,
  BEARD_TEXT,
  BODICE_TEXT,
  BRAID_TEXT,
  HEAD_W_TEXT,
  LONG_TEXT,
  SKIRT_TEXT,
  TAIL_TEXT,
} from './parts';

type Side = 's' | 'w' | 'n';
const SIDES: readonly Side[] = ['s', 'w', 'n'];
const SIZE = 32;
const X = 9;
const Y = 4;
const INK = hex(C.ink);
/** Feet on row 29, as the placeholder people (`ox: 16, oy: 30`). */
const PIVOT = { x: 0.5, y: 30 / SIZE };
/** Which torso or bodice goes with each walk frame: the hands swing on the mid-step frames. */
const SWING = [0, 1, 0, 2] as const;

/** A darker shade of a colour (or, with `f` above 1, its highlight), as the placeholder people shade. */
function shade(colour: string, f = 0.72): string {
  const [r, g, b] = hex(colour);
  const c = (v: number): string =>
    Math.min(255, Math.round(v * f))
      .toString(16)
      .padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/**
 * The letters every people grid is drawn in, coloured per person: skin f/d/l, hair h/g/y, top t/u/v,
 * bottom (pants or skirt) p/q and s/S/z, apron A/E, kerchief c/C/i, beard m/M, tail T/Q, belt b/G,
 * boots o/n, ink k.
 */
export function palette(look: Look): GridPalette {
  const hair = look.hairStyle === 'kerchief' && look.scarf !== undefined ? look.scarf : look.hair;
  return {
    '.': null,
    k: C.ink,
    f: look.skin,
    d: shade(look.skin, 0.8),
    l: shade(look.skin, 1.1),
    h: hair,
    g: shade(hair),
    y: shade(hair, 1.18),
    t: look.top,
    u: shade(look.top),
    v: shade(look.top, 1.22),
    p: look.bottom,
    q: shade(look.bottom),
    s: look.bottom,
    S: shade(look.bottom),
    z: shade(look.bottom, 1.18),
    A: look.apron ?? null,
    E: look.apron === undefined ? null : shade(look.apron),
    m: look.beard ?? null,
    M: look.beard === undefined ? null : shade(look.beard),
    T: look.tail ?? null,
    Q: look.tail === undefined ? null : shade(look.tail, 0.55),
    b: C.belt,
    G: C.belt,
    o: C.boot,
    n: C.bootLight,
  };
}

/** The top `rows` rows of a raster (a child's shorter torso) or, with `fromBottom`, its last rows. */
function crop(src: Raster, rows: number, fromBottom = false): Raster {
  const r = createRaster(src.w, rows);
  const y0 = fromBottom ? src.h - rows : 0;
  for (let y = 0; y < rows; y++) for (let x = 0; x < src.w; x++) setPixel(r, x, y, getPixel(src, x, y0 + y));
  return r;
}

/** The hair rows of a head turned to skin: a bald crown with the hair kept at the sides and back. */
function bald(text: string): string {
  return text
    .split('\n')
    .map((row, i) => (i <= 4 ? row.replace(/[hgy]/g, (ch) => (ch === 'g' ? 'd' : i <= 2 ? 'l' : 'f')) : row))
    .join('\n');
}

export function personFrames(id: string, look: Look): DrawnFrame[] {
  const pal = palette(look);
  const woman = look.legs === 'skirt';
  const headText = woman || look.hairStyle === 'long' || look.hairStyle === 'braid' ? HEAD_W_TEXT : HEAD_TEXT;
  const head = render(
    look.hairStyle === 'bald' ? { s: bald(headText.s), w: bald(headText.w), n: bald(headText.n) } : headText,
    pal,
  );
  const torso = render(TORSO_TEXT, pal);
  const legs = render(LEGS_TEXT, pal);
  const bodice = render(BODICE_TEXT, pal);
  const skirt = render(SKIRT_TEXT, pal);
  const braid = render(BRAID_TEXT, pal);
  const long = render(LONG_TEXT, pal);
  const beard = render(BEARD_TEXT, pal);
  const tail = render(TAIL_TEXT, pal);
  const apron = render({ a: APRON_TEXT }, pal).a;
  const child = look.child === true;
  const drop = child ? 5 : 0;
  const pick = <T>(list: readonly T[], i: number): T => {
    const found = list[i] ?? list[0];
    if (found === undefined) throw new Error('empty part list');
    return found;
  };

  const pose = (side: Side, step: number, breath: boolean): Raster => {
    const r = frame(SIZE);
    const bob = breath || step % 2 === 1 ? 1 : 0;
    const dy = bob + drop;
    const behind = side === 'n';
    if (woman) {
      const sk = pick(skirt[side], step);
      paste(r, child ? crop(sk, 5, true) : sk, X, Y + 20 + (child ? 3 : 0));
      const bo = pick(bodice[side], side === 'n' ? 0 : (SWING[step] ?? 0));
      paste(r, child ? crop(bo, 5) : bo, X, Y + 13 + dy);
    } else {
      const lg = pick(legs[side], step);
      paste(r, child ? crop(lg, 3, true) : lg, X, Y + 20 + (child ? 3 : 0));
      const to = pick(torso[side], SWING[step] ?? 0);
      paste(r, child ? crop(to, 7) : to, X, Y + 11 + dy);
    }
    if (look.apron !== undefined && side === 's')
      paste(r, apron, X + 3, Y + (woman ? 18 : 16) + dy - (child ? 2 : 0));
    if (look.tail !== undefined && side === 'w') paste(r, tail.w, X + 9, Y + 20 + drop);
    // Seen from behind, the tail and the hair hang over the body.
    if (look.tail !== undefined && side === 'n') paste(r, tail.n, X + 5, Y + 22 + drop);
    paste(r, head[side], X, Y + dy);
    if (behind && look.hairStyle === 'long') paste(r, long.n, X, Y + 8 + dy);
    if (behind && look.hairStyle === 'braid') paste(r, braid.n.raster, X + braid.n.dx, Y + braid.n.dy + dy);
    if (!behind && look.hairStyle === 'long') paste(r, long[side], X, Y + 8 + dy);
    if (!behind && look.hairStyle === 'braid')
      paste(r, braid[side].raster, X + braid[side].dx, Y + braid[side].dy + dy);
    if (look.beard !== undefined && side !== 'n')
      paste(r, beard[side], X + (side === 's' ? 2 : 0), Y + 8 + dy);
    return outline(r, INK, 1);
  };

  const out: DrawnFrame[] = [];
  const add = (anim: string, side: Side, i: number, raster: Raster): void => {
    out.push({ name: `npc_${id}_${anim}_${side}_${i}`, raster, pivot: PIVOT });
    if (side === 'w') out.push({ name: `npc_${id}_${anim}_e_${i}`, raster: mirror(raster), pivot: PIVOT });
  };
  for (const side of SIDES) {
    add('idle', side, 0, pose(side, 0, false));
    add('idle', side, 1, pose(side, 0, true));
    for (let i = 0; i < 4; i++) add('walk', side, i, pose(side, i, false));
  }
  return out;
}

/** Every villager under the placeholder names `npc_<id>_<anim>_<dir>_<n>`, coloured from `LOOKS`. */
export function peopleFrames(): DrawnFrame[] {
  return Object.entries(LOOKS).flatMap(([id, look]) => personFrames(id, look));
}
