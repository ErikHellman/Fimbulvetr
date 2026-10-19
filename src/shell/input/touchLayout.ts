import type { Action } from '@core/input/actions';
import type { Rect } from './tapTargets';

/**
 * Where the on-screen controls sit, in CSS pixels. Pure, so the layout is tested without a browser.
 * In play: a floating stick on the left half and a button cluster round the sword on the right. In
 * menus, dialogue and the title: a d-pad on the left and OK/Back on the right. Left-handed mirrors it.
 */

export type TouchContext = 'play' | 'menu';
export type TouchSize = 'small' | 'normal' | 'large';
export const TOUCH_SIZES = ['small', 'normal', 'large'] as const satisfies readonly TouchSize[];
const SIZE_SCALE: Readonly<Record<TouchSize, number>> = { small: 0.85, normal: 1, large: 1.2 };

/** What can be moved in the layout editor: the play buttons and the stick's resting place. */
export const PLAY_BUTTONS = [
  'sword',
  'roll',
  'shield',
  'interact',
  'item1',
  'item2',
  'galdr',
  'menu',
  'map',
] as const satisfies readonly Action[];
export type PlayButton = (typeof PLAY_BUTTONS)[number];
export type Movable = PlayButton | 'stick';
export const MOVABLE: readonly Movable[] = [...PLAY_BUTTONS, 'stick'];

/** A moved control's offset from its home, in button diameters (so it follows the size setting). */
export interface Offset {
  readonly dx: number;
  readonly dy: number;
}
export type Offsets = Partial<Record<Movable, Offset>>;

export interface Insets {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

export interface LayoutInput {
  readonly w: number;
  readonly h: number;
  readonly insets: Insets;
  readonly size: TouchSize;
  readonly leftHanded: boolean;
  readonly offsets: Offsets;
  readonly context: TouchContext;
  /** Play buttons left out (an empty item slot, no galdr known yet). */
  readonly hidden: ReadonlySet<Action>;
  /** Play buttons a menu also needs (the item buttons on the items page), in their play places. */
  readonly extras?: readonly PlayButton[];
}

export interface TouchButton {
  readonly action: Action;
  readonly x: number;
  readonly y: number;
  readonly r: number;
}

export interface StickPlace {
  /** Where the stick rests (drawn faintly) until a thumb lands in its zone. */
  readonly x: number;
  readonly y: number;
  readonly r: number;
  readonly zone: Rect;
}

export interface TouchLayout {
  /** One button diameter. */
  readonly d: number;
  readonly buttons: readonly TouchButton[];
  readonly stick: StickPlace | null;
}

/** A thumb-sized button: about 9 mm on a phone, never smaller than 44 px, capped on big tablets. */
export function buttonSize(w: number, h: number, size: TouchSize): number {
  const base = Math.max(48, Math.min(84, Math.min(w, h) * 0.15));
  return Math.round(base * SIZE_SCALE[size]);
}

/** Home positions, as (dx, dy, diameter) in button diameters from the anchor (see `layout`). */
const RIGHT: Readonly<Record<PlayButton, readonly [number, number, number]>> = {
  sword: [0, 0, 1.3],
  roll: [-1.4, 0.3, 1],
  shield: [-1.15, -0.95, 1],
  interact: [0.05, -1.45, 1],
  item1: [-1.15, -2.2, 0.85],
  item2: [0.05, -2.6, 0.85],
  galdr: [-2.25, -1.55, 0.85],
  menu: [0, 0, 0.75],
  map: [0, 0, 0.75],
};

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

const pos = ([x, y]: [number, number]): { x: number; y: number } => ({ x: Math.round(x), y: Math.round(y) });

export function layout(input: LayoutInput): TouchLayout {
  const { w, h, insets, offsets } = input;
  const d = buttonSize(w, h, input.size);
  // Laid out right-handed in "near/far" terms, then mirrored for the left hand.
  const near = input.leftHanded ? insets.left : insets.right;
  const far = input.leftHanded ? insets.right : insets.left;
  const mirror = (x: number): number => (input.leftHanded ? w - x : x);
  const flip = (dx: number): number => (input.leftHanded ? -dx : dx);
  const keepIn = (x: number, y: number, r: number): [number, number] => [
    clamp(x, insets.left + r, w - insets.right - r),
    clamp(y, insets.top + r, h - insets.bottom - r),
  ];
  const place = (id: Movable, x: number, y: number, r: number): [number, number] => {
    const o = offsets[id];
    return keepIn(x + (o === undefined ? 0 : flip(o.dx) * d), y + (o === undefined ? 0 : o.dy * d), r);
  };
  const anchor = { x: mirror(w - near - 0.9 * d), y: h - insets.bottom - 0.9 * d };
  const stickHome = { x: mirror(far + 1.5 * d), y: h - insets.bottom - 1.5 * d };
  const buttons: TouchButton[] = [];
  const add = (action: Action, x: number, y: number, r: number): void => {
    buttons.push({ action, x: Math.round(x), y: Math.round(y), r });
  };

  if (input.context === 'menu') {
    const r = Math.round(0.4 * d);
    const step = 0.9 * d;
    add('up', stickHome.x, stickHome.y - step, r);
    add('down', stickHome.x, stickHome.y + step, r);
    add(input.leftHanded ? 'right' : 'left', stickHome.x - step, stickHome.y, r);
    add(input.leftHanded ? 'left' : 'right', stickHome.x + step, stickHome.y, r);
    add('confirm', anchor.x, anchor.y, Math.round(0.6 * d));
    add('cancel', anchor.x + flip(RIGHT.roll[0]) * d, anchor.y + RIGHT.roll[1] * d, Math.round(0.5 * d));
    for (const id of input.extras ?? []) {
      const [dx, dy, size] = RIGHT[id];
      add(id, anchor.x + flip(dx) * d, anchor.y + dy * d, Math.round((size * d) / 2));
    }
    return { d, buttons: buttons.map((b) => ({ ...b, ...pos(keepIn(b.x, b.y, b.r)) })), stick: null };
  }

  for (const id of PLAY_BUTTONS) {
    if (input.hidden.has(id)) continue;
    const [dx, dy, size] = RIGHT[id];
    const r = Math.round((size * d) / 2);
    let x = anchor.x + flip(dx) * d;
    let y = anchor.y + dy * d;
    // Menu by the far top corner, the map by the near one, clear of the notch.
    if (id === 'menu') [x, y] = [mirror(far + 0.6 * d), insets.top + 0.6 * d];
    if (id === 'map') [x, y] = [mirror(w - near - 0.6 * d), insets.top + 0.6 * d];
    const [px, py] = place(id, x, y, r);
    add(id, px, py, r);
  }
  const r = Math.round(0.9 * d);
  const [sx, sy] = place('stick', stickHome.x, stickHome.y, r);
  // The stick takes thumbs anywhere on its half below the top row of buttons.
  const zoneTop = insets.top + 1.3 * d;
  const half = Math.round(w * 0.45);
  const zone: Rect = input.leftHanded
    ? { x: w - half, y: zoneTop, w: half, h: h - zoneTop }
    : { x: 0, y: zoneTop, w: half, h: h - zoneTop };
  return { d, buttons, stick: { x: Math.round(sx), y: Math.round(sy), r, zone } };
}

/** The button under a point: the nearest whose circle, grown a little for fat thumbs, holds it. */
export function buttonAt(l: TouchLayout, x: number, y: number): TouchButton | null {
  let best: TouchButton | null = null;
  let bestD = Infinity;
  for (const b of l.buttons) {
    const dx = x - b.x;
    const dy = y - b.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= b.r * 1.15 && dist < bestD) {
      best = b;
      bestD = dist;
    }
  }
  return best;
}
