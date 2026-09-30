import type { Dir4 } from '@core/math/dir';
import type { AnimDef } from '../anims';
import { ellipse, line, rect } from '../draw';
import { outline } from '../outline';
import { C } from '../palette';
import { createRaster, flipX, hex, type Raster } from '../raster';
import { drawPerson, type Look, type Side } from './people';
import type { SpriteFrame } from './types';

/** Haugar and Konungshaugr: warp stones, the barrow's slab door, and what haunts the barrows. */

const INK = hex(C.ink);
const ROCK = hex(C.rock);
const ROCK_SHADE = hex(C.rockShade);
const ROCK_LIGHT = hex(C.rockLight);
const RUNE = hex(C.rune);
const RUNE_DIM = hex('#4c6a70');
const LICHEN = hex('#8a9a5a');

// ── The warp stone: one tile wide, standing 30 px tall, feet 2 px above the tile's bottom ─────────────

const STONE_H = 32;

/** A rune-cut standing stone; awake, its runes shine and a glow rings its foot. */
function warpStone(awake: boolean): Raster {
  const r = createRaster(18, STONE_H);
  const base = STONE_H - 3;
  if (awake) ellipse(r, 9, base, 8, 2.5, hex('#3f6a74'));
  // The stone: a tall slab, narrowing to a rounded head.
  rect(r, 4, 6, 10, base - 5, ROCK);
  ellipse(r, 9, 6, 5, 4, ROCK);
  rect(r, 11, 6, 3, base - 5, ROCK_SHADE);
  rect(r, 4, 5, 2, 10, ROCK_LIGHT);
  rect(r, 5, base - 6, 2, 2, LICHEN);
  // Runes down its face: a zigzag, a cross and a hooked stave.
  const c = awake ? RUNE : RUNE_DIM;
  line(r, 7, 8, 9, 10, c);
  line(r, 9, 10, 7, 12, c);
  line(r, 8, 15, 8, 19, c);
  line(r, 6, 17, 10, 17, c);
  line(r, 8, 22, 8, 26, c);
  line(r, 8, 22, 10, 24, c);
  return outline(r, INK, 1);
}

// ── The barrow-wight: a draugr in mail with a helm, a round shield and a sword (32×32, feet at 16, 30) ─

const WIGHT_LOOK: Look = {
  skin: '#8fa396',
  hair: '#c8c8b8',
  hairStyle: 'bald',
  beard: '#b0b0a0',
  top: '#6a6e74',
  legs: 'pants',
  bottom: '#3a3a36',
};
const WIGHT_EYES = '#bfefff';
const HELM = hex('#7d8490');
const HELM_SHADE = hex('#4f545c');
const BOARD = hex('#6b4a2f');
const BOARD_SHADE = hex('#4a3220');
const BOSS = hex('#b4b9c2');
const BLADE = hex(C.steel);
const BLADE_SHADE = hex(C.steelShade);

type WightPose = 'rest' | 'raise' | 'cut' | 'hurt';

/** A round shield of boards with an iron boss, centred at (cx, cy). */
function roundShield(r: Raster, cx: number, cy: number, face: boolean): void {
  ellipse(r, cx, cy, 5.5, 5.5, INK);
  ellipse(r, cx, cy, 4.5, 4.5, (x) => (x > cx ? BOARD_SHADE : BOARD));
  if (face) {
    ellipse(r, cx, cy, 1.5, 1.5, BOSS);
    line(r, cx - 4, cy, cx - 2, cy, BOARD_SHADE);
  }
}

function wight(side: Side, phase: number, pose: WightPose, sink = 0): Raster {
  const arms = pose === 'raise' ? 'up' : pose === 'cut' ? 'forward' : 'down';
  const r = drawPerson(WIGHT_LOOK, side, phase, { eyes: WIGHT_EYES, arms, ...(sink > 0 ? { sink } : {}) });
  const b = (phase === 1 || phase === 3 ? 1 : 0) + sink;
  if (b > 20) return r;
  // The helm: a rounded iron cap with a nasal guard.
  rect(r, 11, b + 4, 10, 3, HELM);
  rect(r, 12, b + 3, 8, 1, HELM);
  rect(r, 18, b + 4, 3, 3, HELM_SHADE);
  if (side === 's') rect(r, 15, b + 7, 2, 3, HELM_SHADE);
  // The blade: raised overhead on the tell, thrust out on the cut, held low otherwise.
  const hx = side === 'w' ? 12 : 23;
  if (pose === 'raise') {
    rect(r, hx, b + 2, 2, 12, BLADE);
    rect(r, hx + 1, b + 2, 1, 12, BLADE_SHADE);
  } else if (pose === 'cut') {
    if (side === 'w') rect(r, 3, b + 19, 9, 2, BLADE);
    else if (side === 's') rect(r, 22, b + 20, 2, 10, BLADE);
    else rect(r, 22, b + 4, 2, 10, BLADE);
  } else if (side !== 'n' && sink === 0) rect(r, hx, b + 21, 2, 7, BLADE_SHADE);
  // The shield: in front on the near side, on the arm from the side, slung on the back from behind.
  if (pose !== 'hurt' && sink === 0) {
    if (side === 's') roundShield(r, 11, b + 20, true);
    else if (side === 'w') roundShield(r, 9, b + 19, true);
    else roundShield(r, 16, b + 19, false);
  }
  return r;
}

export function haugarFrames(): SpriteFrame[] {
  const fixture = (name: string, raster: Raster): SpriteFrame => ({ name, raster, ox: 9, oy: raster.h - 3 });
  const wights: SpriteFrame[] = [];
  for (const side of ['s', 'n', 'w'] as const) {
    const add = (anim: string, i: number, raster: Raster): void => {
      wights.push({ name: `enemy_haugbui_${anim}_${side}_${String(i)}`, raster, ox: 16, oy: 30 });
      if (side === 'w')
        wights.push({ name: `enemy_haugbui_${anim}_e_${String(i)}`, raster: flipX(raster), ox: 16, oy: 30 });
    };
    add('idle', 0, wight(side, 0, 'rest'));
    for (let i = 0; i < 4; i++) add('walk', i, wight(side, i, 'rest'));
    add('tell', 0, wight(side, 0, 'raise'));
    add('tell', 1, wight(side, 1, 'raise'));
    add('cut', 0, wight(side, 0, 'cut'));
    add('hurt', 0, wight(side, 2, 'hurt'));
    [22, 16, 10, 4].forEach((sink, i) => {
      add('rise', i, wight(side, 0, 'rest', sink));
    });
  }
  return [
    ...wights,
    fixture('fix_warp_dormant_s_0', warpStone(false)),
    fixture('fix_warp_awake_s_0', warpStone(true)),
  ];
}

const one = (frames: number, fps: number): AnimDef => ({ frames, fps, loop: true, dirs: ['s'] });
const ALL: readonly Dir4[] = ['s', 'n', 'w', 'e'];
const all = (frames: number, fps: number, loop = true): AnimDef => ({ frames, fps, loop, dirs: ALL });

export const HAUGAR_ANIMS: Readonly<Record<string, Readonly<Record<string, AnimDef>>>> = {
  fix_warp: { dormant: one(1, 1), awake: one(1, 1) },
  enemy_haugbui: {
    idle: all(1, 1),
    walk: all(4, 5),
    tell: all(2, 6),
    cut: all(1, 1),
    hurt: all(1, 1),
    rise: all(4, 6, false),
  },
};
