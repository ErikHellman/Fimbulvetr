import { line } from '@art/draw';
import { outline } from '@art/outline';
import { C } from '@art/palette';
import { createRaster, getPixel, hex, setPixel, type Raster } from '@art/raster';
import { frame, mirror, paste, rot90, type DrawnFrame } from '../lib/sprite';
import { ARMS_FWD, ARMS_UP, HEAD, LEGS, TORSO } from './parts';
import { blade as bladeProp, FALLEN, ROLL, SHIELD, type Blade, type Dir8 } from './props';

type Side = 's' | 'w' | 'n';
type Arms = 'down' | 'up' | 'forward';
type ShieldPos = 'none' | 'front' | 'side' | 'back';
const SIDES: readonly Side[] = ['s', 'w', 'n'];
const INK = hex(C.ink);
const SMALL = 32;
const LARGE = 48;
/** The 13 px part strips sit at this x in a 32 px frame; the head starts at this y and the feet end on row 29. */
const X = 9;
const Y = 4;
const pivotOf = (size: number) => (size === LARGE ? { x: 0.5, y: 38 / LARGE } : { x: 0.5, y: 30 / SMALL });
/** Where the weapon hand is, per facing, in a 32 px frame. */
/** The weapon shoulder, per facing; a swinging arm runs from here towards the blade. */
const SHOULDER: Readonly<Record<Side, readonly [number, number]>> = { s: [19, 16], w: [11, 16], n: [10, 16] };
const DIR_VEC: Readonly<Record<Dir8, readonly [number, number]>> = {
  n: [0, -1],
  ne: [1, -1],
  e: [1, 0],
  se: [1, 1],
  s: [0, 1],
  sw: [-1, 1],
  w: [-1, 0],
  nw: [-1, -1],
};
/** Where the shield sits, per position, in a 32 px frame (top-left of the drawn shield). */
const SHIELD_AT: Readonly<Record<Exclude<ShieldPos, 'none'>, readonly [number, number]>> = {
  front: [11, 14],
  side: [6, 13],
  back: [11, 13],
};
const RESTING: Readonly<Record<Side, ShieldPos>> = { s: 'none', w: 'none', n: 'back' };
const RAISED: Readonly<Record<Side, ShieldPos>> = { s: 'front', w: 'side', n: 'back' };
const FORWARD: Readonly<Record<Side, Dir8>> = { s: 's', w: 'w', n: 'n' };
const ATTACK_ARCS: Readonly<
  Record<Side, Readonly<Record<'attack1' | 'attack2' | 'attack3', readonly Dir8[]>>>
> = {
  s: { attack1: ['e', 'se', 's'], attack2: ['w', 'sw', 's'], attack3: ['s', 's', 's'] },
  w: { attack1: ['n', 'nw', 'w'], attack2: ['s', 'sw', 'w'], attack3: ['w', 'w', 'w'] },
  n: { attack1: ['w', 'nw', 'n'], attack2: ['e', 'ne', 'n'], attack3: ['n', 'n', 'n'] },
};
const SWING = [0, 1, 0, 2];

interface Pose {
  readonly side: Side;
  readonly legs?: number;
  readonly arms?: Arms;
  readonly shield?: ShieldPos;
  readonly sword?: Dir8;
  readonly blade?: Blade;
  /** The body a pixel lower on the legs: the idle breath and the passing frames of a walk. */
  readonly bob?: boolean;
  readonly size?: number;
}

function pose(p: Pose): Raster {
  const size = p.size ?? SMALL;
  const o = (size - SMALL) / 2;
  const legs = p.legs ?? 0;
  const bob = p.bob === true || legs % 2 === 1 ? 1 : 0;
  const arms = p.arms ?? 'down';
  const behind = p.side === 'n';
  const r = createRaster(size, size);
  const weapon = (): void => {
    if (p.sword === undefined) return;
    const prop = bladeProp(p.blade ?? 'sword', p.sword);
    const [dx, dy] = DIR_VEC[p.sword];
    const [sx, sy] = SHOULDER[p.side];
    // The arm reaches 4 px from the shoulder towards the swing; the hand holds the blade there.
    const hx = sx + dx * 4;
    const hy = sy + 2 + dy * 3;
    const tunic = hex(p.side === 'n' || dx > 0 ? C.tunicShade : C.tunic);
    line(r, o + sx, o + sy + bob, o + hx, o + hy + bob, tunic);
    line(r, o + sx + 1, o + sy + bob, o + hx + 1, o + hy + bob, tunic);
    line(r, o + sx, o + sy + bob + 1, o + hx, o + hy + bob + 1, tunic);
    const skin = hex(p.side === 'n' ? C.skinShade : C.skin);
    for (const [kx, ky] of [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ] as const)
      setPixel(r, o + hx + kx, o + hy + bob + ky, skin);
    paste(r, prop.raster, o + hx - prop.hand.x, o + hy + bob - prop.hand.y);
  };
  if (behind) weapon();
  if (behind && arms === 'up') paste(r, ARMS_UP.n, o + X - 2, o + Y + bob - 2);
  const part = (list: readonly Raster[], i: number): Raster => {
    const found = list[i] ?? list[0];
    if (found === undefined) throw new Error('empty part list');
    return found;
  };
  paste(r, part(LEGS[p.side], legs), o + X, o + Y + 20);
  const torso = part(TORSO[p.side], arms === 'down' ? (SWING[legs] ?? 0) : 3);
  paste(r, torso, o + X, o + Y + 11 + bob);
  if (!behind && arms === 'up') paste(r, ARMS_UP[p.side], o + X - 2, o + Y + bob - 2);
  paste(r, HEAD[p.side], o + X, o + Y + bob);
  if (p.shield !== undefined && p.shield !== 'none') {
    const [sx, sy] = SHIELD_AT[p.shield];
    paste(r, SHIELD[p.shield], o + sx, o + sy + bob);
  }
  if (arms === 'forward') {
    const a = ARMS_FWD[p.side];
    paste(r, a.raster, o + X + a.dx, o + Y + bob + a.dy);
  }
  if (!behind) weapon();
  return outline(r, INK, 1);
}

const WATERLINE = 21;

/** Everything below the waterline goes under; a ripple ring circles Ask. */
function swimming(src: Raster, i: number): Raster {
  const r = createRaster(src.w, src.h);
  for (let y = 0; y < WATERLINE; y++) for (let x = 0; x < src.w; x++) setPixel(r, x, y, getPixel(src, x, y));
  const ring = hex(C.waterLight);
  const rx = 9 + (i % 2);
  for (let x = -rx; x <= rx; x++) {
    const dy = Math.round(2.5 * Math.sqrt(Math.max(0, 1 - (x * x) / (rx * rx))));
    setPixel(r, 16 + x, WATERLINE + dy, ring);
    if (Math.abs(x) > rx - 3) setPixel(r, 16 + x, WATERLINE - dy, ring);
  }
  return r;
}

/** Rings spreading where Ask went under, and bubbles rising. */
function dive(i: number): Raster {
  const r = createRaster(SMALL, SMALL);
  const ring = hex(C.waterLight);
  const shade = hex(C.waterShade);
  const rx = 5 + i * 2;
  for (let x = -rx; x <= rx; x++) {
    const dy = Math.round(rx * 0.5 * Math.sqrt(Math.max(0, 1 - (x * x) / (rx * rx))));
    setPixel(r, 16 + x, 24 + dy, ring);
    setPixel(r, 16 + x, 24 - dy, i === 0 ? ring : shade);
  }
  setPixel(r, 15, 20 - i * 2, ring);
  setPixel(r, 18, 18 - i * 2, ring);
  return r;
}

/** Kári's rod, from the hands out over the water; the tip dips on the second frame. */
const ROD: Readonly<Record<Side, readonly [number, number, number, number]>> = {
  s: [19, 23, 29, 8],
  w: [8, 18, 2, 6],
  n: [19, 13, 26, 3],
};

function withRod(r: Raster, side: Side, dip: number): Raster {
  const [x0, y0, x1, y1] = ROD[side];
  line(r, x0, y0, x1, y1 + dip, hex(C.woodShade));
  line(r, x0, y0 - 1, x1, y1 + dip - 1, hex(C.wood));
  return r;
}

/** The bow held out in front; the stave bends away from Ask and the string is drawn on the first frame. */
const BOW: Readonly<Record<Side, readonly [number, number]>> = { s: [16, 25], w: [6, 18], n: [16, 12] };

function withBow(r: Raster, side: Side, drawn: boolean): Raster {
  const [x, y] = BOW[side];
  const wood = hex(C.wood);
  const shade = hex(C.woodShade);
  const pull = drawn ? 2 : 0;
  if (side === 'w') {
    line(r, x + 1, y - 7, x - 1, y - 3, wood);
    line(r, x - 1, y - 3, x - 1, y + 3, wood);
    line(r, x - 1, y + 3, x + 1, y + 7, wood);
    line(r, x + 1, y - 7, x + 2 + pull, y, shade);
    line(r, x + 2 + pull, y, x + 1, y + 7, shade);
  } else {
    const dy = side === 's' ? 1 : -1;
    line(r, x - 7, y - dy, x - 3, y + dy, wood);
    line(r, x - 3, y + dy, x + 3, y + dy, wood);
    line(r, x + 3, y + dy, x + 7, y - dy, wood);
    line(r, x - 7, y - dy, x, y - dy * (2 + pull), shade);
    line(r, x, y - dy * (2 + pull), x + 7, y - dy, shade);
  }
  return r;
}

function roll(i: number): Raster {
  let ball = ROLL;
  for (let k = 0; k < i; k++) ball = rot90(ball);
  const r = frame(SMALL);
  paste(r, ball, 16 - Math.floor(ball.w / 2), 26 - ball.h);
  return outline(r, INK, 1);
}

function fallen(): Raster {
  const r = frame(SMALL);
  paste(r, FALLEN, 2, 24);
  return outline(r, INK, 1);
}

export interface Kit {
  readonly blade: Blade;
  readonly shield: boolean;
}

export const KITS: Readonly<Record<string, Kit>> = {
  hero: { blade: 'sword', shield: true },
  hero_axe: { blade: 'axe', shield: false },
  hero_fork: { blade: 'fork', shield: false },
};

export function heroFrames(art: string, kit: Kit): DrawnFrame[] {
  const out: DrawnFrame[] = [];
  const add = (anim: string, side: Side, i: number, raster: Raster): void => {
    const pivot = pivotOf(raster.w);
    out.push({ name: `${art}_${anim}_${side}_${i}`, raster, pivot });
    if (side === 'w') out.push({ name: `${art}_${anim}_e_${i}`, raster: mirror(raster), pivot });
  };
  const rest = (side: Side): ShieldPos => (kit.shield ? RESTING[side] : 'none');
  const raised = (side: Side): ShieldPos => (kit.shield ? RAISED[side] : 'none');
  const blade = kit.blade;
  for (const side of SIDES) {
    add('idle', side, 0, pose({ side, shield: rest(side) }));
    add('idle', side, 1, pose({ side, shield: rest(side), bob: true }));
    add('hurt', side, 0, pose({ side, shield: rest(side), arms: 'forward', bob: true }));
    add('shield', side, 0, pose({ side, shield: raised(side) }));
    for (let i = 0; i < 4; i++) {
      add('walk', side, i, pose({ side, legs: i, shield: rest(side) }));
      add('shieldwalk', side, i, pose({ side, legs: i, shield: raised(side) }));
      add('carrywalk', side, i, pose({ side, legs: i, arms: 'up' }));
    }
    add('lift', side, 0, pose({ side, arms: 'forward' }));
    add('lift', side, 1, pose({ side, arms: 'up' }));
    add('carry', side, 0, pose({ side, arms: 'up' }));
    add('throw', side, 0, pose({ side, arms: 'up' }));
    add('throw', side, 1, pose({ side, arms: 'forward' }));
    add('push', side, 0, pose({ side, legs: 1, arms: 'forward' }));
    add('push', side, 1, pose({ side, legs: 3, arms: 'forward' }));
    add('toss', side, 0, pose({ side, shield: rest(side), arms: 'up' }));
    add('toss', side, 1, pose({ side, shield: rest(side), arms: 'forward' }));
    for (let i = 0; i < 2; i++) add('fish', side, i, withRod(pose({ side, arms: 'forward' }), side, i));
    for (let i = 0; i < 2; i++) add('bow', side, i, withBow(pose({ side, arms: 'forward' }), side, i === 0));
    add('cast', side, 0, pose({ side, shield: rest(side), arms: 'up' }));
    add('cast', side, 1, pose({ side, shield: rest(side), arms: 'up', bob: true }));
    add('cast', side, 2, pose({ side, shield: rest(side), arms: 'forward' }));
    add('charge', side, 0, pose({ side, shield: rest(side), sword: FORWARD[side], blade, size: LARGE }));
    for (let i = 0; i < 2; i++)
      add(
        'thrust',
        side,
        i,
        pose({ side, legs: i === 0 ? 1 : 3, shield: rest(side), sword: FORWARD[side], blade, size: LARGE }),
      );
    for (let i = 0; i < 4; i++)
      add('swim', side, i, swimming(pose({ side, arms: i % 2 === 0 ? 'forward' : 'down' }), i));
    for (const anim of ['attack1', 'attack2', 'attack3'] as const) {
      ATTACK_ARCS[side][anim].forEach((dir, i) => {
        add(anim, side, i, pose({ side, shield: rest(side), sword: dir, blade, size: LARGE }));
      });
    }
  }
  const spin: readonly (readonly [Side, boolean])[] = [
    ['s', false],
    ['w', false],
    ['n', false],
    ['w', true],
  ];
  spin.forEach(([side, flip], i) => {
    const r = pose({ side, shield: rest(side), sword: FORWARD[side], blade, size: LARGE });
    out.push({ name: `${art}_spin_s_${i}`, raster: flip ? mirror(r) : r, pivot: pivotOf(LARGE) });
  });
  for (let i = 0; i < 4; i++)
    out.push({ name: `${art}_roll_s_${i}`, raster: roll(i), pivot: pivotOf(SMALL) });
  const turn: readonly (readonly [Side, boolean])[] = [
    ['s', false],
    ['w', false],
    ['n', false],
    ['w', true],
    ['s', false],
  ];
  turn.forEach(([side, flip], i) => {
    const r = pose({ side });
    out.push({ name: `${art}_dying_s_${i}`, raster: flip ? mirror(r) : r, pivot: pivotOf(SMALL) });
  });
  out.push({ name: `${art}_dying_s_5`, raster: fallen(), pivot: pivotOf(SMALL) });
  for (let i = 0; i < 2; i++)
    out.push({ name: `${art}_dive_s_${i}`, raster: dive(i), pivot: pivotOf(SMALL) });
  return out;
}
