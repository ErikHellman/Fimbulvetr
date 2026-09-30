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

// ── Gates of stone: a barrow's slab door and the pass's rune seals (one tile each) ────────────────────

const GATE_H = 34;

/** A standing slab of the barrow's door, carved with a knot; `open`, only the sill and the dark beyond. */
function slab(open: boolean): Raster {
  const r = createRaster(18, GATE_H);
  const base = GATE_H - 3;
  if (open) {
    rect(r, 1, base - 3, 16, 3, ROCK_SHADE);
    rect(r, 1, base - 3, 16, 1, ROCK_LIGHT);
    return outline(r, INK, 1);
  }
  rect(r, 1, 4, 16, base - 3, ROCK);
  rect(r, 13, 4, 4, base - 3, ROCK_SHADE);
  rect(r, 1, 4, 16, 2, ROCK_LIGHT);
  ellipse(r, 9, 16, 4, 4, ROCK_SHADE);
  ellipse(r, 9, 16, 2.5, 2.5, ROCK);
  line(r, 5, 12, 13, 20, ROCK_SHADE);
  line(r, 13, 12, 5, 20, ROCK_SHADE);
  return outline(r, INK, 1);
}

/** One of the pass's three seals: a squat pillar whose rune burns once its stone is lit. */
function seal(lit: boolean): Raster {
  const r = createRaster(18, GATE_H);
  const base = GATE_H - 3;
  rect(r, 3, 12, 12, base - 11, ROCK_SHADE);
  rect(r, 3, 12, 9, base - 11, ROCK);
  rect(r, 2, 10, 14, 3, ROCK_LIGHT);
  const c = lit ? RUNE : RUNE_DIM;
  line(r, 9, 16, 9, 26, c);
  line(r, 6, 19, 9, 16, c);
  line(r, 12, 19, 9, 16, c);
  if (lit) {
    ellipse(r, 9, 6, 4, 4, hex('#3f6a74'));
    ellipse(r, 9, 6, 2, 2, RUNE);
  }
  return outline(r, INK, 1);
}

/** A parry's spark: a four-pointed star that flares and fades (16×16, centred low). */
function spark(i: number): Raster {
  const r = createRaster(16, 16);
  const n = [3, 6, 5, 3][i] ?? 3;
  const c = i < 2 ? hex('#fff6c8') : hex('#e8c860');
  ellipse(r, 8, 8, 2.5, 2.5, hex('#e8c860'));
  rect(r, 8 - n, 7, 2 * n + 1, 2, c);
  rect(r, 7, 8 - n, 2, 2 * n + 1, c);
  if (i < 3) {
    const d = Math.max(1, n - 3);
    line(r, 8 - d, 8 - d, 8 + d, 8 + d, c);
    line(r, 8 - d, 8 + d, 8 + d, 8 - d, c);
  }
  return r;
}

// ── The bow's arrow in flight (by facing), the arrow pot, and the eye switch ──────────────────────────

const SHAFT = hex(C.wood);
const HEAD = hex(C.steel);
const FLETCH = hex('#e8e0c8');

/** An arrow flying east: 14×5 (flipped for west; north and south are drawn upright). */
function arrowSide(): Raster {
  const r = createRaster(16, 7);
  rect(r, 2, 3, 10, 1, SHAFT);
  rect(r, 12, 2, 2, 3, HEAD);
  rect(r, 14, 3, 1, 1, HEAD);
  rect(r, 1, 2, 2, 1, FLETCH);
  rect(r, 1, 4, 2, 1, FLETCH);
  return outline(r, INK, 1);
}

function arrowUp(): Raster {
  const r = createRaster(7, 16);
  rect(r, 3, 4, 1, 10, SHAFT);
  rect(r, 2, 2, 3, 2, HEAD);
  rect(r, 3, 1, 1, 1, HEAD);
  rect(r, 2, 13, 1, 2, FLETCH);
  rect(r, 4, 13, 1, 2, FLETCH);
  return outline(r, INK, 1);
}

function flipY(src: Raster): Raster {
  const r = createRaster(src.w, src.h);
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) {
      const i = (y * src.w + x) * 4;
      const j = ((src.h - 1 - y) * src.w + x) * 4;
      for (let k = 0; k < 4; k++) r.data[j + k] = src.data[i + k] ?? 0;
    }
  return r;
}

/** A clay pot bristling with old arrow shafts. */
function arrowPot(): Raster {
  const r = createRaster(16, 18);
  ellipse(r, 8, 12, 6, 4.5, (x) => (x > 10 ? hex(C.clayShade) : hex(C.clay)));
  rect(r, 5, 6, 6, 2, hex(C.clayShade));
  for (const [x, top] of [
    [6, 1],
    [8, 0],
    [10, 2],
  ] as const) {
    rect(r, x, top + 2, 1, 5, SHAFT);
    rect(r, x - 1, top, 3, 2, FLETCH);
  }
  return outline(r, INK, 1);
}

/** A heap of grave-gold: coins, a cup and a torc, glinting. */
function graveGold(): Raster {
  const r = createRaster(16, 14);
  const gold = hex('#e8c050');
  const shade = hex('#a8802a');
  const light = hex('#fff0a0');
  ellipse(r, 8, 10, 6.5, 3, (x) => (x > 10 ? shade : gold));
  rect(r, 5, 4, 4, 5, gold);
  rect(r, 7, 4, 2, 5, shade);
  rect(r, 4, 3, 6, 1, gold);
  ellipse(r, 12, 7, 2.5, 2, shade);
  for (const [x, y] of [
    [4, 9],
    [9, 8],
    [11, 11],
    [6, 5],
  ] as const)
    rect(r, x, y, 1, 1, light);
  return outline(r, INK, 1);
}

/** An eye carved in a stone block: shut (a closed lid) or opened by an arrow (a glowing pupil). */
function eyeStone(open: boolean): Raster {
  const r = createRaster(18, 18);
  rect(r, 1, 1, 16, 16, ROCK);
  rect(r, 13, 1, 4, 16, ROCK_SHADE);
  rect(r, 1, 1, 16, 2, ROCK_LIGHT);
  ellipse(r, 9, 9, 6, 3.5, hex('#241c1c'));
  if (open) {
    ellipse(r, 9, 9, 5, 2.8, hex('#e8e0c8'));
    ellipse(r, 9, 9, 2, 2, RUNE);
  } else line(r, 3, 9, 15, 9, ROCK_SHADE);
  return outline(r, INK, 1);
}

// ── The draugr archer (32×32, feet at 16, 30) and the barrow-warden (48×48, feet at 24, 45) ─────────────

const ARCHER_LOOK: Look = {
  skin: '#9aab9c',
  hair: '#d9d8c8',
  hairStyle: 'long',
  top: '#4a4a3a',
  legs: 'pants',
  bottom: '#35332a',
};

type ArcherPose = 'rest' | 'draw' | 'loose' | 'hurt';

function archer(side: Side, phase: number, pose: ArcherPose, sink = 0): Raster {
  const arms = pose === 'rest' || pose === 'hurt' ? 'down' : 'forward';
  const r = drawPerson(ARCHER_LOOK, side, phase, { eyes: WIGHT_EYES, arms, ...(sink > 0 ? { sink } : {}) });
  if (sink > 0 || pose === 'hurt') return r;
  const b = phase === 1 || phase === 3 ? 1 : 0;
  const wood = hex(C.woodShade);
  const cord = hex('#d8d0bc');
  const pull = pose === 'draw' ? 3 : 0;
  if (side === 'w') {
    line(r, 7, b + 12, 5, b + 18, wood);
    line(r, 5, b + 18, 7, b + 24, wood);
    line(r, 7, b + 12, 9 + pull, b + 18, cord);
    line(r, 9 + pull, b + 18, 7, b + 24, cord);
  } else if (side === 's') {
    line(r, 9, b + 20, 16, b + 23, wood);
    line(r, 16, b + 23, 23, b + 20, wood);
    line(r, 9, b + 20, 16, b + 20 - pull, cord);
    line(r, 16, b + 20 - pull, 23, b + 20, cord);
  } else rect(r, 21, b + 8, 1, 14, wood);
  return r;
}

/** The Haugbúi King's spectral axe, spinning: four frames of a pale blade on a haft (18×18). */
function axe(i: number): Raster {
  const r = createRaster(18, 18);
  const ghost = hex('#b8e8f0');
  const pale = hex('#7fd8e8');
  const haft = hex('#8a9aa0');
  const cx = 9;
  const cy = 9;
  const [dx, dy] = (
    [
      [1, 0],
      [0.7, 0.7],
      [0, 1],
      [-0.7, 0.7],
    ] as const
  )[i % 4] ?? [1, 0];
  line(
    r,
    Math.round(cx - dx * 6),
    Math.round(cy - dy * 6),
    Math.round(cx + dx * 6),
    Math.round(cy + dy * 6),
    haft,
  );
  ellipse(r, cx + dx * 5, cy + dy * 5, 3, 3, pale);
  ellipse(r, cx + dx * 5, cy + dy * 5, 1.5, 1.5, ghost);
  return outline(r, INK, 1);
}

/** Nearest-neighbour scale by 3/2: the warden is the wight drawn half again as large. */
function grow(src: Raster): Raster {
  const w = Math.floor((src.w * 3) / 2);
  const h = Math.floor((src.h * 3) / 2);
  const r = createRaster(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (Math.floor((y * 2) / 3) * src.w + Math.floor((x * 2) / 3)) * 4;
      const j = (y * w + x) * 4;
      for (let k = 0; k < 4; k++) r.data[j + k] = src.data[i + k] ?? 0;
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
    add('sleep', 0, wight(side, 0, 'rest', 22));
  }
  const archers: SpriteFrame[] = [];
  const wardens: SpriteFrame[] = [];
  for (const side of ['s', 'n', 'w'] as const) {
    const add = (
      list: SpriteFrame[],
      art: string,
      anim: string,
      i: number,
      raster: Raster,
      ox: number,
      oy: number,
    ): void => {
      list.push({ name: `${art}_${anim}_${side}_${String(i)}`, raster, ox, oy });
      if (side === 'w')
        list.push({ name: `${art}_${anim}_e_${String(i)}`, raster: flipX(raster), ox: raster.w - ox, oy });
    };
    const a = (anim: string, i: number, r: Raster): void => {
      add(archers, 'enemy_bogdraugr', anim, i, r, 16, 30);
    };
    a('idle', 0, archer(side, 0, 'rest'));
    for (let i = 0; i < 4; i++) a('walk', i, archer(side, i, 'rest'));
    a('tell', 0, archer(side, 0, 'loose'));
    a('tell', 1, archer(side, 0, 'draw'));
    a('loose', 0, archer(side, 0, 'loose'));
    a('hurt', 0, archer(side, 2, 'hurt'));
    [22, 16, 10, 4].forEach((sink, i) => {
      a('rise', i, archer(side, 0, 'rest', sink));
    });
    a('sleep', 0, archer(side, 0, 'rest', 22));
    const w = (anim: string, i: number, r: Raster): void => {
      add(wardens, 'enemy_haugvordr', anim, i, grow(r), 24, 45);
    };
    w('idle', 0, wight(side, 0, 'rest'));
    for (let i = 0; i < 4; i++) w('walk', i, wight(side, i, 'rest'));
    w('tell', 0, wight(side, 0, 'raise'));
    w('tell', 1, wight(side, 1, 'raise'));
    w('sweep', 0, wight(side, 0, 'cut'));
    w('brace', 0, wight(side, 1, 'rest'));
    w('bash', 0, wight(side, 1, 'rest'));
    w('bash', 1, wight(side, 3, 'rest'));
    w('dazed', 0, wight(side, 2, 'hurt'));
  }
  const sparks = Array.from({ length: 4 }, (_, i) => ({
    name: `fx_spark_idle_s_${String(i)}`,
    raster: spark(i),
    ox: 8,
    oy: 8,
  }));
  const side = arrowSide();
  const up = arrowUp();
  const arrows: SpriteFrame[] = [
    { name: 'fx_arrow_fly_e_0', raster: side, ox: 8, oy: 3 },
    { name: 'fx_arrow_fly_w_0', raster: flipX(side), ox: 8, oy: 3 },
    { name: 'fx_arrow_fly_n_0', raster: up, ox: 3, oy: 8 },
    { name: 'fx_arrow_fly_s_0', raster: flipY(up), ox: 3, oy: 8 },
  ];
  const axes = Array.from({ length: 4 }, (_, i) => ({
    name: `fx_axe_fly_s_${String(i)}`,
    raster: axe(i),
    ox: 9,
    oy: 9,
  }));
  return [
    ...axes,
    ...archers,
    ...wardens,
    ...arrows,
    { name: 'prop_arrow_pot_idle_s_0', raster: arrowPot(), ox: 8, oy: 17 },
    { name: 'prop_grave_gold_idle_s_0', raster: graveGold(), ox: 8, oy: 13 },
    fixture('fix_eye_on_s_0', eyeStone(true)),
    fixture('fix_eye_off_s_0', eyeStone(false)),
    ...sparks,
    ...wights,
    fixture('fix_warp_dormant_s_0', warpStone(false)),
    fixture('fix_warp_awake_s_0', warpStone(true)),
    fixture('fix_slab_closed_s_0', slab(false)),
    fixture('fix_slab_open_s_0', slab(true)),
    fixture('fix_seal_dark_s_0', seal(false)),
    fixture('fix_seal_lit_s_0', seal(true)),
  ];
}

const one = (frames: number, fps: number): AnimDef => ({ frames, fps, loop: true, dirs: ['s'] });
const ALL: readonly Dir4[] = ['s', 'n', 'w', 'e'];
const all = (frames: number, fps: number, loop = true): AnimDef => ({ frames, fps, loop, dirs: ALL });

export const HAUGAR_ANIMS: Readonly<Record<string, Readonly<Record<string, AnimDef>>>> = {
  fx_arrow: { fly: { frames: 1, fps: 1, loop: true, dirs: ALL } },
  fx_axe: { fly: { frames: 4, fps: 16, loop: true, dirs: ['s'] } },
  prop_arrow_pot: { idle: one(1, 1) },
  prop_grave_gold: { idle: one(1, 1) },
  fix_eye: { on: one(1, 1), off: one(1, 1) },
  fx_spark: { idle: { frames: 4, fps: 16, loop: false, dirs: ['s'] } },
  fix_warp: { dormant: one(1, 1), awake: one(1, 1) },
  fix_slab: { closed: one(1, 1), open: one(1, 1) },
  fix_seal: { dark: one(1, 1), lit: one(1, 1) },
  enemy_haugbui: {
    idle: all(1, 1),
    walk: all(4, 5),
    tell: all(2, 6),
    cut: all(1, 1),
    hurt: all(1, 1),
    rise: all(4, 6, false),
    sleep: all(1, 1),
  },
  enemy_bogdraugr: {
    idle: all(1, 1),
    walk: all(4, 5),
    tell: all(2, 5, false),
    loose: all(1, 1),
    hurt: all(1, 1),
    rise: all(4, 6, false),
    sleep: all(1, 1),
  },
  enemy_haugvordr: {
    idle: all(1, 1),
    walk: all(4, 4),
    tell: all(2, 6),
    sweep: all(1, 1),
    brace: all(1, 1),
    bash: all(2, 8),
    dazed: all(1, 1),
  },
};
