import { line } from '@art/draw';
import type { GridPalette } from '@art/grid';
import { outline } from '@art/outline';
import { C } from '@art/palette';
import { ellipse } from '@art/draw';
import { createRaster, getPixel, hex, setPixel, type Raster, type Rgba } from '@art/raster';
import type { Look } from '@art/sprites/people';
import { ARMS_FWD_TEXT, ARMS_UP_TEXT, HEAD_TEXT, LEGS_TEXT, TORSO_TEXT, render } from '../hero/parts';
import { blade, type Dir8 } from '../hero/props';
import { frame, grid, mirror, paste, type DrawnFrame } from '../lib/sprite';
import { BEARD_TEXT, BODICE_TEXT, HEAD_W_TEXT, LONG_TEXT, SKIRT_TEXT } from '../people/parts';
import { palette } from '../people/build';

/**
 * The barrows' dead on the villagers' drawn body: the haugbúi (a wight in a helm with a round shield
 * and a sword), the bogdraugr (an archer with long grey hair and a bow), the haugvörðr (the wight grown
 * half again, in darker mail) and the Haugbúi King (grown, in a purple tunic under a gold crown whose
 * gems blaze when he charges). All rise out of a grave mound like the draugr.
 */

export type Side = 's' | 'w' | 'n';
export type Arms = 'down' | 'up' | 'forward';
const SIZE = 32;
const X = 9;
const Y = 4;
const INK = hex(C.ink);
const SWING = [0, 1, 0, 2] as const;
const DEAD_EYES = '#bfefff';

const WIGHT_LOOK: Look = {
  skin: '#8fa396',
  hair: '#c8c8b8',
  hairStyle: 'bald',
  beard: '#b0b0a0',
  top: '#6a6e74',
  legs: 'pants',
  bottom: '#3a3a36',
};
const WARDEN_LOOK: Look = {
  ...WIGHT_LOOK,
  skin: '#7f9488',
  top: '#4e545c',
  bottom: '#2e2e2c',
  beard: '#9a9a8c',
};
const KING_LOOK: Look = { ...WIGHT_LOOK, top: '#5a3a5a', bottom: '#2a2a34', beard: '#d8d8c8' };
const ARCHER_LOOK: Look = {
  skin: '#9aab9c',
  hair: '#d9d8c8',
  hairStyle: 'long',
  top: '#4a4a3a',
  legs: 'pants',
  bottom: '#35332a',
};

/** Iron, boards, a boss and a gold crown: the letters the wights' gear is drawn in. */
const GEAR: GridPalette = {
  '.': null,
  H: '#7d8490',
  h: '#4f545c',
  i: '#aab0ba',
  r: '#6b4a2f',
  q: '#4a3220',
  s: '#8a6a48',
  B: '#b4b9c2',
  k: C.ink,
  G: '#e8c050',
  g: '#a8802a',
  y: '#fff0a0',
};

/** The helm: a rounded iron cap, from the front with its nasal, from the side and from behind. */
const HELM = {
  s: grid(
    GEAR,
    `
    ....iiiiii...
    ..iiHHHHHHh..
    .iHHHHHHHHHh.
    .HHHHHHHHHHh.
    .HHHHHHHHHhh.
    .h...hh...hh.
    .....hh......
    .....hh......
  `,
  ),
  w: grid(
    GEAR,
    `
    ....iiiiii...
    ..iiHHHHHHh..
    .iHHHHHHHHHh.
    .HHHHHHHHHHh.
    .HHHHHHHHHhh.
    .hh.......hh.
    .hh..........
    .hh..........
  `,
  ),
  n: grid(
    GEAR,
    `
    ....iiiiii...
    ..iiHHHHHHh..
    .iHHHHHHHHHh.
    .HHHHHHHHHHh.
    .HHHHHHHHHhh.
    .hhhhhhhhhhh.
  `,
  ),
};

/** A round shield of boards with an iron boss: its face, edge-on, and its back. */
const SHIELD = {
  front: grid(
    GEAR,
    `
    ...kkkkk...
    .kkrrrrrkk.
    .krrsrrrqk.
    krrrsBBrqqk
    krrrBiBrqqk
    krrrrBBqqqk
    krrrrrrqqqk
    .krrrrqqqk.
    .kkrqqqqkk.
    ...kkkkk...
  `,
  ),
  side: grid(
    GEAR,
    `
    .k.
    krk
    krq
    krq
    kBq
    kBq
    krq
    krq
    krq
    kqk
    .k.
  `,
  ),
  back: grid(
    GEAR,
    `
    ...kkkk...
    .kkrrrrkk.
    .krrrrrrk.
    krrrhhrrrk
    krrrhhrrrk
    krrrrrrrrk
    .krrrrrrk.
    .kkrrrrkk.
    ...kkkk...
  `,
  ),
};

/** The crown on the grown king: a gold band with three points, a gem under each. */
const CROWN = {
  lit: grid(
    GEAR,
    `
    y.....y.....y.
    Gg...Gg....Gg.
    Gg...Gg....Gg.
    GGGGGGGGGGGGgg
    GyyGGGyyGGGyyg
    GGGGGGGGGGGGgg
  `,
  ),
  dim: grid(
    GEAR,
    `
    ..............
    Gg...Gg....Gg.
    Gg...Gg....Gg.
    GGGGGGGGGGGGgg
    GkkGGGkkGGGkkg
    GGGGGGGGGGGGgg
  `,
  ),
  back: grid(
    GEAR,
    `
    ..............
    Gg...Gg....Gg.
    Gg...Gg....Gg.
    GGGGGGGGGGGGgg
    GGGGGGGGGGGGgg
    GGGGGGGGGGGGgg
  `,
  ),
};

const MOUND = `
..........dDDDDDDDDDDDDd........
.......dDDDDDDDDDDDDDDDDDDd.....
.....dDDDDDDDDDDDDDDDDDDDDDDd...
...dDDDDDDDDDDDDDDDDDDDDDDDDDDd.
..dddddddddddddddddddddddddddddd
`;
const mound = grid({ '.': null, D: C.dirt, d: C.dirtShade }, MOUND);

function bald(text: string): string {
  return text
    .split('\n')
    .map((row, i) => (i <= 4 ? row.replace(/[hgy]/g, (ch) => (ch === 'g' ? 'd' : i <= 2 ? 'l' : 'f')) : row))
    .join('\n');
}

function deadEyes(text: string): string {
  return text
    .split('\n')
    .map((row, i) => (i === 7 || i === 8 ? row.replace(/k/g, 'E') : row))
    .join('\n');
}

const pick = <T>(list: readonly T[], i: number): T => {
  const found = list[i] ?? list[0];
  if (found === undefined) throw new Error('empty part list');
  return found;
};

/** Where the weapon hand is per facing: the sword hangs from here at rest and rises from here on the tell. */
const HAND: Readonly<Record<Side, number>> = { s: 23, w: 12, n: 10 };

export interface Gear {
  readonly helm: boolean;
  readonly shield: boolean;
  readonly sword: boolean;
  readonly bow: boolean;
  /** The tower shield of Náströnd, or the chain-flail whirling over his head (drawn on the grown frame). */
  readonly tower?: boolean;
}

export const NO_GEAR: Gear = { helm: false, shield: false, sword: false, bow: false };

/** How a figure is built: the eyes it has, whether it wears a bodice and skirt, and what it rises out of. */
export interface Build {
  /** The colour of dead eyes; left out, the eyes stay ink. */
  readonly eyes?: string;
  /** A fish tail in place of the legs (the marbendill), per facing. */
  readonly tail?: Readonly<Record<Side, Raster>>;
  /** What it rises out of: a mound of earth, or a ring of mist. */
  readonly rise?: 'mound' | 'mist';
}

const MIST: Rgba = [200, 210, 214, 120];

/** A ring of mist on the ground where something rises or lies hidden. */
export function mistRing(r: Raster, cx: number, cy: number, rx: number, ry: number): void {
  ellipse(r, cx, cy, rx, ry, () => MIST);
}

/** One of the dead (or a living foe) on the villagers' body: its parts rendered once, posed on demand. */
export class Wight {
  private readonly head;
  private readonly torso;
  private readonly legs;
  private readonly bodice;
  private readonly skirt;
  private readonly armsUp;
  private readonly armsFwd;
  private readonly beard;
  private readonly long;
  private readonly look: Look;
  private readonly build: Build;

  constructor(look: Look, build: Build = { eyes: DEAD_EYES, rise: 'mound' }) {
    this.look = look;
    this.build = build;
    const pal: GridPalette = { ...palette(look), E: build.eyes ?? C.ink };
    const woman = look.legs === 'skirt';
    const base = woman || look.hairStyle === 'long' ? HEAD_W_TEXT : HEAD_TEXT;
    const headText = look.hairStyle === 'bald' ? { s: bald(base.s), w: bald(base.w), n: bald(base.n) } : base;
    this.head = render({ s: deadEyes(headText.s), w: deadEyes(headText.w), n: headText.n }, pal);
    this.torso = render(TORSO_TEXT, pal);
    this.legs = render(LEGS_TEXT, pal);
    this.bodice = render(BODICE_TEXT, pal);
    this.skirt = render(SKIRT_TEXT, pal);
    this.armsUp = render(ARMS_UP_TEXT, pal);
    this.armsFwd = render(ARMS_FWD_TEXT, pal);
    this.beard = render(BEARD_TEXT, pal);
    this.long = render(LONG_TEXT, pal);
  }

  /** The figure without its ink, so grown copies can be outlined at their own size. */
  figure(side: Side, step: number, arms: Arms, gear: Gear, swordDir?: Dir8): Raster {
    const r = frame(SIZE);
    const bob = step % 2 === 1 ? 1 : 0;
    const behind = side === 'n';
    const sword = (): void => {
      if (!gear.sword || swordDir === undefined) return;
      const prop = blade('sword', swordDir);
      const hx = HAND[side];
      const hy = swordDir === 'n' ? Y + bob + 10 : arms === 'forward' ? Y + bob + 17 : Y + bob + 14;
      paste(r, prop.raster, hx - prop.hand.x, hy - prop.hand.y);
    };
    if (behind) sword();
    if (behind && gear.shield) paste(r, SHIELD.back, 11, Y + bob + 11);
    if (behind && arms === 'up') paste(r, this.armsUp.n, X - 2, Y + bob - 2);
    const woman = this.look.legs === 'skirt';
    if (this.build.tail !== undefined) paste(r, this.build.tail[side], X, Y + 20);
    else if (woman) paste(r, pick(this.skirt[side], step), X, Y + 20);
    else paste(r, pick(this.legs[side], step), X, Y + 20);
    if (woman) paste(r, pick(this.bodice[side], side === 'n' ? 0 : (SWING[step] ?? 0)), X, Y + 13 + bob);
    else paste(r, pick(this.torso[side], arms === 'down' ? (SWING[step] ?? 0) : 3), X, Y + 11 + bob);
    if (!behind && arms === 'up') paste(r, this.armsUp[side], X - 2, Y + bob - 2);
    paste(r, this.head[side], X, Y + bob);
    if (this.look.hairStyle === 'long') paste(r, this.long[side], X, Y + 8 + bob);
    if (this.look.beard !== undefined && side !== 'n')
      paste(r, this.beard[side], X + (side === 's' ? 2 : 0), Y + 8 + bob);
    if (gear.helm) paste(r, HELM[side], X, Y + bob - 1);
    if (arms === 'forward') {
      const a = this.armsFwd[side];
      paste(r, a.raster, X + a.dx, Y + bob + a.dy);
    }
    if (gear.bow && arms === 'forward') this.bow(r, side, bob, step === 3);
    if (!behind && gear.shield && arms !== 'forward') {
      if (side === 's') paste(r, SHIELD.front, 5, Y + bob + 10);
      else paste(r, SHIELD.side, 7, Y + bob + 9);
    }
    if (!behind) sword();
    return r;
  }

  /** The bow held out before the archer; its string is drawn on the `drawn` frame. */
  private bow(r: Raster, side: Side, bob: number, drawn: boolean): void {
    const wood = hex(C.woodShade);
    const cord = hex('#d8d0bc');
    const pull = drawn ? 3 : 0;
    const b = Y + bob;
    if (side === 'w') {
      line(r, 7, b + 8, 4, b + 14, wood);
      line(r, 4, b + 14, 7, b + 20, wood);
      line(r, 7, b + 8, 9 + pull, b + 14, cord);
      line(r, 9 + pull, b + 14, 7, b + 20, cord);
    } else if (side === 's') {
      line(r, 8, b + 15, 16, b + 19, wood);
      line(r, 16, b + 19, 24, b + 15, wood);
      line(r, 8, b + 15, 16, b + 16 - pull, cord);
      line(r, 16, b + 16 - pull, 24, b + 15, cord);
    } else {
      line(r, 22, b + 4, 22, b + 18, wood);
    }
  }

  pose(side: Side, step: number, arms: Arms, gear: Gear, swordDir?: Dir8): Raster {
    return outline(this.figure(side, step, arms, gear, swordDir), INK, 1);
  }

  /** The figure sunk `sink` px into its grave, the earth heaped (or the mist curled) over what is under the ground line. */
  risen(side: Side, sink: number, gear: Gear, arms: Arms = 'up', step = 0): Raster {
    const figure = this.figure(side, step, arms, { ...gear, shield: false, sword: false, bow: false });
    const mist = this.build.rise === 'mist';
    const r = createRaster(SIZE, SIZE);
    const ground = mist ? 29 : 27;
    for (let y = 0; y < ground; y++)
      for (let x = 0; x < SIZE; x++) {
        const sy = y - sink;
        if (sy >= 0) setPixel(r, x, y, getPixel(figure, x, sy));
      }
    if (mist) {
      const out = outline(r, INK, 1);
      mistRing(out, 16, 28, 10, 2.2);
      return out;
    }
    paste(r, mound, 0, 25);
    return outline(r, INK, 1);
  }
}

/** Nearest-neighbour scale by 3/2: the warden, the king and the hollow are the figure drawn half again as large. */
export function grow(src: Raster): Raster {
  const w = Math.floor((src.w * 3) / 2);
  const h = Math.floor((src.h * 3) / 2);
  const r = createRaster(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      setPixel(r, x, y, getPixel(src, Math.floor((x * 2) / 3), Math.floor((y * 2) / 3)));
  return r;
}

export const PIVOT_32 = { x: 0.5, y: 30 / SIZE };
const PIVOT_48 = { x: 0.5, y: 45 / 48 };
export const PIVOT_KING = { x: 0.5, y: 51 / 54 };
const SIDES: readonly Side[] = ['s', 'w', 'n'];
export const FORWARD: Readonly<Record<Side, Dir8>> = { s: 's', w: 'w', n: 'n' };
export { INK };
const WIGHT_GEAR: Gear = { helm: true, shield: true, sword: true, bow: false };
const ARCHER_GEAR: Gear = { helm: false, shield: false, sword: false, bow: true };
const KING_GEAR: Gear = { helm: false, shield: false, sword: true, bow: false };

export function wightFrames(): DrawnFrame[] {
  const out: DrawnFrame[] = [];
  const add = (
    art: string,
    anim: string,
    side: Side,
    i: number,
    raster: Raster,
    pivot: { x: number; y: number },
  ): void => {
    out.push({ name: `${art}_${anim}_${side}_${i}`, raster, pivot });
    if (side === 'w') out.push({ name: `${art}_${anim}_e_${i}`, raster: mirror(raster), pivot });
  };

  const wight = new Wight(WIGHT_LOOK);
  for (const side of SIDES) {
    const w = (anim: string, i: number, r: Raster): void => {
      add('enemy_haugbui', anim, side, i, r, PIVOT_32);
    };
    w('idle', 0, wight.pose(side, 0, 'down', WIGHT_GEAR, 's'));
    for (let i = 0; i < 4; i++) w('walk', i, wight.pose(side, i, 'down', WIGHT_GEAR, 's'));
    w('tell', 0, wight.pose(side, 0, 'up', WIGHT_GEAR, 'n'));
    w('tell', 1, wight.pose(side, 1, 'up', WIGHT_GEAR, 'n'));
    w('cut', 0, wight.pose(side, 0, 'forward', WIGHT_GEAR, FORWARD[side]));
    w('hurt', 0, wight.pose(side, 2, 'down', { ...WIGHT_GEAR, shield: false }));
    [22, 16, 10, 4].forEach((sink, i) => {
      w('rise', i, wight.risen(side, sink, WIGHT_GEAR));
    });
    w('sleep', 0, wight.risen(side, 22, WIGHT_GEAR));
  }

  const archer = new Wight(ARCHER_LOOK);
  for (const side of SIDES) {
    const a = (anim: string, i: number, r: Raster): void => {
      add('enemy_bogdraugr', anim, side, i, r, PIVOT_32);
    };
    a('idle', 0, archer.pose(side, 0, 'down', ARCHER_GEAR));
    for (let i = 0; i < 4; i++) a('walk', i, archer.pose(side, i, 'down', ARCHER_GEAR));
    a('tell', 0, archer.pose(side, 0, 'forward', ARCHER_GEAR));
    a('tell', 1, archer.pose(side, 3, 'forward', ARCHER_GEAR));
    a('loose', 0, archer.pose(side, 0, 'forward', ARCHER_GEAR));
    a('hurt', 0, archer.pose(side, 2, 'down', ARCHER_GEAR));
    [22, 16, 10, 4].forEach((sink, i) => {
      a('rise', i, archer.risen(side, sink, ARCHER_GEAR));
    });
    a('sleep', 0, archer.risen(side, 22, ARCHER_GEAR));
  }

  const warden = new Wight(WARDEN_LOOK);
  const big = (side: Side, step: number, arms: Arms, dir?: Dir8): Raster =>
    outline(grow(warden.figure(side, step, arms, WIGHT_GEAR, dir)), INK, 1);
  for (const side of SIDES) {
    const v = (anim: string, i: number, r: Raster): void => {
      add('enemy_haugvordr', anim, side, i, r, PIVOT_48);
    };
    v('idle', 0, big(side, 0, 'down', 's'));
    for (let i = 0; i < 4; i++) v('walk', i, big(side, i, 'down', 's'));
    v('tell', 0, big(side, 0, 'up', 'n'));
    v('tell', 1, big(side, 1, 'up', 'n'));
    v('sweep', 0, big(side, 0, 'forward', FORWARD[side]));
    v('brace', 0, big(side, 1, 'down', 's'));
    v('bash', 0, big(side, 1, 'down', 's'));
    v('bash', 1, big(side, 3, 'down', 's'));
    v('dazed', 0, outline(grow(warden.figure(side, 2, 'down', { ...WIGHT_GEAR, shield: false })), INK, 1));
  }

  const king = new Wight(KING_LOOK);
  const crowned = (side: Side, step: number, arms: Arms, blaze: boolean, dir?: Dir8, sunk = 0): Raster => {
    const figure = grow(king.figure(side, step, arms, KING_GEAR, dir));
    const r = createRaster(48, 54);
    // Six rows of headroom over the grown figure for the crown.
    for (let y = 0; y < 48 - sunk; y++)
      for (let x = 0; x < 48; x++) setPixel(r, x, y + 6 + sunk, getPixel(figure, x, y));
    const bob = step % 2 === 1 ? 1 : 0;
    const crown = side === 'n' ? CROWN.back : blaze ? CROWN.lit : CROWN.dim;
    paste(r, crown, 17, Math.round((Y + bob + 1) * 1.5) + 6 - 3 + sunk);
    return outline(r, INK, 1);
  };
  for (const side of SIDES) {
    const k = (anim: string, i: number, r: Raster): void => {
      add('enemy_haugkonungr', anim, side, i, r, PIVOT_KING);
    };
    k('idle', 0, crowned(side, 0, 'down', false, 's'));
    for (let i = 0; i < 4; i++) k('walk', i, crowned(side, i, 'down', false, 's'));
    k('roar', 0, crowned(side, 0, 'up', true, 'n'));
    k('tell', 0, crowned(side, 0, 'up', false, 'n'));
    k('tell', 1, crowned(side, 1, 'up', false, 'n'));
    k('sweep', 0, crowned(side, 0, 'forward', false, FORWARD[side]));
    k('lower', 0, crowned(side, 1, 'down', true, 's'));
    k('lower', 1, crowned(side, 3, 'down', true, 's'));
    k('charge', 0, crowned(side, 1, 'down', true, 's'));
    k('charge', 1, crowned(side, 3, 'down', true, 's'));
    k('dazed', 0, crowned(side, 2, 'down', false));
    k('fallen', 0, crowned(side, 0, 'down', false, undefined, 12));
  }
  return out;
}
