import type { WeaponId } from '@content/ids';
import type { Dir4 } from '@core/math/dir';
import type { AnimDef } from '../anims';
import { ellipse, line, rect } from '../draw';
import { outline } from '../outline';
import { C } from '../palette';
import { createRaster, flipX, hex, type Raster } from '../raster';
import type { SpriteFrame } from './types';

const P = {
  ink: hex(C.ink),
  skin: hex(C.skin),
  skinShade: hex(C.skinShade),
  hair: hex(C.hair),
  hairShade: hex(C.hairShade),
  tunic: hex(C.tunic),
  tunicShade: hex(C.tunicShade),
  belt: hex(C.belt),
  pants: hex(C.pants),
  pantsShade: hex(C.pantsShade),
  boot: hex(C.boot),
  steel: hex(C.steel),
  steelShade: hex(C.steelShade),
  grip: hex(C.wood),
  shield: hex(C.shield),
  shieldShade: hex(C.shieldShade),
  rim: hex(C.shieldRim),
} as const;

/** Drawn sides; east is baked by mirroring west. */
type Side = 's' | 'n' | 'w';
type ShieldPos = 'none' | 'front' | 'side' | 'back';
type SwordDir = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

const SMALL = 32;
const LARGE = 48;
const HAND: Readonly<Record<Side, readonly [number, number]>> = { s: [23, 22], w: [12, 21], n: [9, 20] };
const SWORD_VEC: Readonly<Record<SwordDir, readonly [number, number]>> = {
  n: [0, -1],
  ne: [1, -1],
  e: [1, 0],
  se: [1, 1],
  s: [0, 1],
  sw: [-1, 1],
  w: [-1, 0],
  nw: [-1, -1],
};
const RESTING: Readonly<Record<Side, ShieldPos>> = { s: 'none', w: 'none', n: 'back' };
const RAISED: Readonly<Record<Side, ShieldPos>> = { s: 'front', w: 'side', n: 'back' };
const FORWARD: Readonly<Record<Side, SwordDir>> = { s: 's', w: 'w', n: 'n' };
const ATTACK_ARCS: Readonly<
  Record<Side, Readonly<Record<'attack1' | 'attack2' | 'attack3', readonly SwordDir[]>>>
> = {
  s: { attack1: ['e', 'se', 's'], attack2: ['w', 'sw', 's'], attack3: ['s', 's', 's'] },
  w: { attack1: ['n', 'nw', 'w'], attack2: ['s', 'sw', 'w'], attack3: ['w', 'w', 'w'] },
  n: { attack1: ['w', 'nw', 'n'], attack2: ['e', 'ne', 'n'], attack3: ['n', 'n', 'n'] },
};
const ROLL_SPOTS: readonly (readonly [number, number])[] = [
  [0, -4],
  [4, 0],
  [0, 4],
  [-4, 0],
];

function legs(r: Raster, o: number, side: Side, phase: number): void {
  if (side === 'w') {
    const swing = [0, 1, 0, -1][phase] ?? 0;
    rect(r, o + 16 - swing, o + 24, 3, 4, P.pantsShade);
    rect(r, o + 16 - swing, o + 28, 4, 2, P.boot);
    rect(r, o + 13 + swing, o + 24, 3, 4, P.pants);
    rect(r, o + 12 + swing, o + 28, 4, 2, P.boot);
    return;
  }
  const liftL = phase === 1 ? 1 : 0;
  const liftR = phase === 3 ? 1 : 0;
  rect(r, o + 12, o + 24, 3, 4 - liftL, P.pants);
  rect(r, o + 11, o + 28 - liftL, 4, 2, P.boot);
  rect(r, o + 17, o + 24, 3, 4 - liftR, P.pantsShade);
  rect(r, o + 17, o + 28 - liftR, 4, 2, P.boot);
}

/** Where the arms are: down at the sides, raised overhead (lifting, carrying) or thrust forward (throwing). */
type Arms = 'down' | 'up' | 'forward';

/**
 * Walk-cycle arm swing per phase, opposite to the lifted leg. Seen from the side the near arm moves
 * towards the facing and back; from the front or back the arms rise and drop a little.
 */
export const ARM_SWING_SIDE: readonly number[] = [0, -2, 0, 2];
export const ARM_SWING_LEFT: readonly number[] = [0, 1, 0, -2];
export const ARM_SWING_RIGHT: readonly number[] = [0, -2, 0, 1];

function torso(r: Raster, o: number, b: number, side: Side, phase: number, arms: Arms = 'down'): void {
  if (side === 'w') {
    rect(r, o + 11, b + 15, 10, 9, P.tunic);
    rect(r, o + 18, b + 15, 3, 9, P.tunicShade);
    rect(r, o + 11, b + 21, 10, 1, P.belt);
    if (arms !== 'down') return;
    const swing = ARM_SWING_SIDE[phase] ?? 0;
    rect(r, o + 13 + swing, b + 16, 3, 6, P.tunicShade);
    rect(r, o + 13 + swing, b + 22, 3, 2, P.skin);
    return;
  }
  rect(r, o + 10, b + 15, 12, 9, P.tunic);
  rect(r, o + 19, b + 15, 3, 9, P.tunicShade);
  rect(r, o + 10, b + 21, 12, 1, P.belt);
  if (arms !== 'down') return;
  const dl = ARM_SWING_LEFT[phase] ?? 0;
  const dr = ARM_SWING_RIGHT[phase] ?? 0;
  rect(r, o + 8, b + 16 + dl, 2, 6, P.tunic);
  rect(r, o + 8, b + 22 + dl, 2, 2, P.skin);
  rect(r, o + 22, b + 16 + dr, 2, 6, P.tunicShade);
  rect(r, o + 22, b + 22 + dr, 2, 2, P.skinShade);
}

/** Raised or thrust arms, drawn over the head (or behind it when facing north). */
function liftedArms(r: Raster, o: number, b: number, side: Side, arms: Arms): void {
  if (arms === 'down') return;
  if (arms === 'up') {
    if (side === 'w') {
      rect(r, o + 13, b + 4, 3, 12, P.tunicShade);
      rect(r, o + 13, b + 2, 3, 2, P.skin);
      return;
    }
    rect(r, o + 8, b + 4, 2, 12, P.tunic);
    rect(r, o + 8, b + 2, 2, 2, P.skin);
    rect(r, o + 22, b + 4, 2, 12, P.tunicShade);
    rect(r, o + 22, b + 2, 2, 2, P.skinShade);
    return;
  }
  if (side === 'w') {
    rect(r, o + 6, b + 16, 8, 3, P.tunicShade);
    rect(r, o + 4, b + 16, 2, 3, P.skin);
    return;
  }
  const y = side === 's' ? b + 22 : b + 12;
  rect(r, o + 11, y, 3, 3, P.skin);
  rect(r, o + 18, y, 3, 3, P.skinShade);
}

function head(r: Raster, o: number, b: number, side: Side): void {
  const cx = o + 16;
  const cy = b + 8.5;
  ellipse(r, cx, cy, 6.5, 6.5, (x, y) => {
    const dx = x + 0.5 - cx;
    const dy = y + 0.5 - cy;
    if (side === 'n') return dx > 2.5 ? P.hairShade : P.hair;
    if (side === 's') {
      if (dy < -1.5 || Math.abs(dx) > 5) return dx > 3 ? P.hairShade : P.hair;
      return dx > 2.5 ? P.skinShade : P.skin;
    }
    if (dy < -1.5 || dx > 0.5) return dx > 3.5 ? P.hairShade : P.hair;
    return dy > 3 ? P.skinShade : P.skin;
  });
  if (side === 's') {
    rect(r, o + 13, b + 9, 1, 2, P.ink);
    rect(r, o + 18, b + 9, 1, 2, P.ink);
  }
  if (side === 'w') rect(r, o + 11, b + 9, 1, 2, P.ink);
}

function shield(r: Raster, o: number, b: number, pos: ShieldPos): void {
  const disc = (cx: number, cy: number, rx: number, ry: number): void => {
    ellipse(r, cx, cy, rx, ry, (x, y) => {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy > 0.62) return P.rim;
      return dx + dy > 0.3 ? P.shieldShade : P.shield;
    });
  };
  if (pos === 'front') disc(o + 16, b + 19.5, 5.5, 5.5);
  else if (pos === 'side') disc(o + 10, b + 19, 3, 5.5);
  else if (pos === 'back') disc(o + 16, b + 18.5, 5, 5);
}

/** What Ask holds: the seax (a short sword), Halvar's hand-axe or the raid-night pitchfork. */
export type Blade = 'sword' | 'axe' | 'fork';

function weapon(r: Raster, hx: number, hy: number, dir: SwordDir, blade: Blade): void {
  const [dx, dy] = SWORD_VEC[dir];
  const diag = dx !== 0 && dy !== 0;
  const px = -dy;
  const py = dx;
  if (blade === 'axe') {
    // A short haft and a bearded head on one side.
    const len = diag ? 6 : 8;
    line(r, hx - dx * 2, hy - dy * 2, hx + dx * len, hy + dy * len, P.grip);
    for (let k = 0; k < 3; k++)
      line(
        r,
        hx + dx * (len - k) + px,
        hy + dy * (len - k) + py,
        hx + dx * (len - k) + px * 4,
        hy + dy * (len - k) + py * 4,
        k === 0 ? P.steelShade : P.steel,
      );
    return;
  }
  if (blade === 'fork') {
    // A long haft ending in three tines.
    const len = diag ? 9 : 12;
    line(r, hx - dx * 3, hy - dy * 3, hx + dx * len, hy + dy * len, P.grip);
    line(
      r,
      hx + dx * len - px * 2,
      hy + dy * len - py * 2,
      hx + dx * len + px * 2,
      hy + dy * len + py * 2,
      P.steelShade,
    );
    for (const k of [-2, 0, 2])
      line(
        r,
        hx + dx * len + px * k,
        hy + dy * len + py * k,
        hx + dx * (len + 2) + px * k,
        hy + dy * (len + 2) + py * k,
        P.steel,
      );
    return;
  }
  const len = diag ? 9 : 12;
  line(r, hx - dx * 3, hy - dy * 3, hx, hy, P.grip);
  line(r, hx - px * 2, hy - py * 2, hx + px * 2, hy + py * 2, P.grip);
  line(r, hx + dx, hy + dy, hx + dx * len, hy + dy * len, P.steel);
  line(r, hx + dx + px, hy + dy + py, hx + dx * len + px, hy + dy * len + py, P.steelShade);
}

interface Pose {
  readonly side: Side;
  readonly phase: number;
  readonly shield: ShieldPos;
  readonly sword?: SwordDir;
  readonly arms?: Arms;
  readonly blade?: Blade;
}

function drawPose(pose: Pose, size: number): Raster {
  const r = createRaster(size, size);
  const o = (size - SMALL) / 2;
  const b = o + (pose.phase === 1 || pose.phase === 3 ? 1 : 0);
  const [hx, hy] = HAND[pose.side];
  const behind = pose.side === 'n';
  const blade = pose.blade ?? 'sword';
  if (pose.sword !== undefined && behind) weapon(r, o + hx, b + hy, pose.sword, blade);
  const arms = pose.arms ?? 'down';
  legs(r, o, pose.side, pose.phase);
  if (behind) liftedArms(r, o, b, pose.side, arms);
  torso(r, o, b, pose.side, pose.phase, arms);
  head(r, o, b, pose.side);
  if (!behind) liftedArms(r, o, b, pose.side, arms);
  shield(r, o, b, pose.shield);
  if (pose.sword !== undefined && !behind) weapon(r, o + hx, b + hy, pose.sword, blade);
  return outline(r, P.ink, 2);
}

function drawRoll(i: number): Raster {
  const r = createRaster(SMALL, SMALL);
  ellipse(r, 16, 21, 7, 7, (x, y) => (x + y > 38 ? P.tunicShade : P.tunic));
  const [sx, sy] = ROLL_SPOTS[i % ROLL_SPOTS.length] ?? [0, -4];
  ellipse(r, 16 + sx, 21 + sy, 3, 3, P.hair);
  rect(r, 15 - sx, 20 - sy, 3, 2, P.boot);
  return outline(r, P.ink, 2);
}

/** Ask lying on his side, knocked out: head west, boots east. */
function drawFallen(): Raster {
  const r = createRaster(SMALL, SMALL);
  rect(r, 20, 23, 4, 3, P.pants);
  rect(r, 20, 26, 4, 2, P.pantsShade);
  rect(r, 24, 23, 3, 5, P.boot);
  rect(r, 12, 22, 8, 6, P.tunic);
  rect(r, 12, 26, 8, 2, P.tunicShade);
  rect(r, 17, 22, 1, 6, P.belt);
  ellipse(r, 8, 24, 3.5, 3.5, (x) => (x < 7 ? P.hair : P.skin));
  return outline(r, P.ink, 2);
}

const frame = (name: string, raster: Raster): SpriteFrame =>
  raster.w === LARGE ? { name, raster, ox: 24, oy: 38 } : { name, raster, ox: 16, oy: 30 };

/** What the hero sprite shows: the blade in hand, and whether the round shield is carried. */
export interface HeroKit {
  readonly blade: Blade;
  readonly shield: boolean;
}

/** The hero's art keys, one per kit; every kit draws every hero animation. */
export const HERO_KITS = {
  hero: { blade: 'sword', shield: true },
  hero_axe: { blade: 'axe', shield: false },
  hero_fork: { blade: 'fork', shield: false },
} as const satisfies Record<string, HeroKit>;

export type HeroArt = keyof typeof HERO_KITS;

/** The art to draw the hero with, for the weapon in hand (the farm and the raid night have no shield). */
export function heroArtFor(weapon: WeaponId): HeroArt {
  if (weapon === 'handaxe') return 'hero_axe';
  if (weapon === 'pitchfork') return 'hero_fork';
  return 'hero';
}

export function heroFrames(): SpriteFrame[] {
  return Object.entries(HERO_KITS).flatMap(([art, kit]) => kitFrames(art, kit));
}

function kitFrames(art: string, kit: HeroKit): SpriteFrame[] {
  const out: SpriteFrame[] = [];
  const add = (anim: string, side: Side, i: number, raster: Raster): void => {
    out.push(frame(`${art}_${anim}_${side}_${i}`, raster));
    if (side === 'w') out.push(frame(`${art}_${anim}_e_${i}`, flipX(raster)));
  };
  const RESTING_KIT: Readonly<Record<Side, ShieldPos>> = kit.shield
    ? RESTING
    : { s: 'none', w: 'none', n: 'none' };
  const RAISED_KIT: Readonly<Record<Side, ShieldPos>> = kit.shield
    ? RAISED
    : { s: 'none', w: 'none', n: 'none' };
  const blade = kit.blade;
  for (const side of ['s', 'n', 'w'] as const) {
    add('idle', side, 0, drawPose({ side, phase: 0, shield: RESTING_KIT[side] }, SMALL));
    add('hurt', side, 0, drawPose({ side, phase: 0, shield: RESTING_KIT[side] }, SMALL));
    add('shield', side, 0, drawPose({ side, phase: 0, shield: RAISED_KIT[side] }, SMALL));
    for (let i = 0; i < 4; i++) {
      add('walk', side, i, drawPose({ side, phase: i, shield: RESTING_KIT[side] }, SMALL));
      add('shieldwalk', side, i, drawPose({ side, phase: i, shield: RAISED_KIT[side] }, SMALL));
      add('carrywalk', side, i, drawPose({ side, phase: i, shield: 'none', arms: 'up' }, SMALL));
    }
    add('lift', side, 0, drawPose({ side, phase: 0, shield: 'none', arms: 'forward' }, SMALL));
    add('lift', side, 1, drawPose({ side, phase: 0, shield: 'none', arms: 'up' }, SMALL));
    add('carry', side, 0, drawPose({ side, phase: 0, shield: 'none', arms: 'up' }, SMALL));
    add('throw', side, 0, drawPose({ side, phase: 0, shield: 'none', arms: 'up' }, SMALL));
    add('throw', side, 1, drawPose({ side, phase: 0, shield: 'none', arms: 'forward' }, SMALL));
    // Leaning on a root block: arms out, feet digging in.
    add('push', side, 0, drawPose({ side, phase: 1, shield: 'none', arms: 'forward' }, SMALL));
    add('push', side, 1, drawPose({ side, phase: 3, shield: 'none', arms: 'forward' }, SMALL));
    // Sending a sub-item off (the boomerang): wind up, let go.
    add('toss', side, 0, drawPose({ side, phase: 0, shield: RESTING_KIT[side], arms: 'up' }, SMALL));
    add('toss', side, 1, drawPose({ side, phase: 0, shield: RESTING_KIT[side], arms: 'forward' }, SMALL));
    // Singing a galdr: hands raised, then flung forward as the song leaves them.
    add('cast', side, 0, drawPose({ side, phase: 0, shield: RESTING_KIT[side], arms: 'up' }, SMALL));
    add('cast', side, 1, drawPose({ side, phase: 1, shield: RESTING_KIT[side], arms: 'up' }, SMALL));
    add('cast', side, 2, drawPose({ side, phase: 0, shield: RESTING_KIT[side], arms: 'forward' }, SMALL));
    add(
      'charge',
      side,
      0,
      drawPose({ side, phase: 0, shield: RESTING_KIT[side], sword: FORWARD[side], blade }, LARGE),
    );
    for (const anim of ['attack1', 'attack2', 'attack3'] as const) {
      ATTACK_ARCS[side][anim].forEach((dir, i) => {
        add(anim, side, i, drawPose({ side, phase: 0, shield: RESTING_KIT[side], sword: dir, blade }, LARGE));
      });
    }
  }
  const spin: readonly (readonly [Side, boolean])[] = [
    ['s', false],
    ['w', false],
    ['n', false],
    ['w', true],
  ];
  spin.forEach(([side, mirror], i) => {
    const r = drawPose({ side, phase: 0, shield: RESTING_KIT[side], sword: FORWARD[side], blade }, LARGE);
    out.push(frame(`${art}_spin_s_${i}`, mirror ? flipX(r) : r));
  });
  for (let i = 0; i < 4; i++) out.push(frame(`${art}_roll_s_${i}`, drawRoll(i)));
  const turn: readonly (readonly [Side, boolean])[] = [
    ['s', false],
    ['w', false],
    ['n', false],
    ['w', true],
    ['s', false],
  ];
  turn.forEach(([side, mirror], i) => {
    const r = drawPose({ side, phase: 0, shield: 'none' }, SMALL);
    out.push(frame(`${art}_dying_s_${i}`, mirror ? flipX(r) : r));
  });
  out.push(frame(`${art}_dying_s_5`, drawFallen()));
  return out;
}

const ALL: readonly Dir4[] = ['s', 'n', 'w', 'e'];

export const HERO_ANIMS = {
  idle: { frames: 1, fps: 1, loop: true, dirs: ALL },
  hurt: { frames: 1, fps: 1, loop: true, dirs: ALL },
  walk: { frames: 4, fps: 8, loop: true, dirs: ALL },
  shield: { frames: 1, fps: 1, loop: true, dirs: ALL },
  shieldwalk: { frames: 4, fps: 8, loop: true, dirs: ALL },
  charge: { frames: 1, fps: 1, loop: true, dirs: ALL },
  attack1: { frames: 3, fps: 14, loop: false, dirs: ALL },
  attack2: { frames: 3, fps: 14, loop: false, dirs: ALL },
  attack3: { frames: 3, fps: 10, loop: false, dirs: ALL },
  spin: { frames: 4, fps: 10, loop: false, dirs: ['s'] },
  roll: { frames: 4, fps: 13, loop: false, dirs: ['s'] },
  lift: { frames: 2, fps: 10, loop: false, dirs: ALL },
  carry: { frames: 1, fps: 1, loop: true, dirs: ALL },
  carrywalk: { frames: 4, fps: 7, loop: true, dirs: ALL },
  throw: { frames: 2, fps: 12, loop: false, dirs: ALL },
  push: { frames: 2, fps: 4, loop: true, dirs: ALL },
  toss: { frames: 2, fps: 12, loop: false, dirs: ALL },
  cast: { frames: 3, fps: 10, loop: false, dirs: ALL },
  /** Spins through the four facings and falls; held on the last frame. */
  dying: { frames: 6, fps: 8, loop: false, dirs: ['s'] },
} satisfies Record<string, AnimDef>;
