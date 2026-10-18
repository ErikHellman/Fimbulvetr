import { nextFloat, nextInt } from '@core/math/rng';
import type { Painter } from './painter';
import { insideBlob } from './tiles/blob';

/** A material's three tones (see docs/art-style-guide.md, rule 2). */
export interface Tones {
  readonly base: string;
  readonly shade: string;
  readonly light: string;
}

/** How a blob region stands against the ground around it (rule 1). */
export type Relief = 'raised' | 'sunken' | 'flat';

export interface RegionLook extends Tones {
  readonly relief: Relief;
  /** Optional grain inside the region: a colour and the share of pixels it takes. */
  readonly speck?: string;
  readonly density?: number;
}

const TILE = 16;

/**
 * Grass tufts: a light tip with a shaded root below and below-right, one per `cell`×`cell` square with a
 * jittered position, skipping some squares so the grid never shows. Light from the top-left (rule 3).
 */
export function tufts(p: Painter, t: Tones, cell: number, chance = 0.7): void {
  for (let cy = 0; cy < TILE; cy += cell) {
    for (let cx = 0; cx < TILE; cx += cell) {
      if (nextFloat(p.rng) > chance) continue;
      const x = cx + nextInt(p.rng, 0, Math.max(1, cell - 1));
      const y = Math.min(TILE - 2, cy + nextInt(p.rng, 0, Math.max(1, cell - 1)));
      p.px(x, y, t.light);
      p.px(x, y + 1, t.shade);
      p.px(x + 1, y + 1, t.shade);
    }
  }
}

/**
 * Clods, pebbles, stones: `count` blocks up to `size` px wide and two or three tall, the base colour with a
 * light pixel on the upper-left corner and a shade run along the bottom-right.
 */
export function clods(p: Painter, t: Tones, count: number, size: number): void {
  for (let i = 0; i < count; i++) {
    const w = nextInt(p.rng, 2, size + 1);
    const h = nextInt(p.rng, 2, 4);
    const x = nextInt(p.rng, 0, TILE);
    const y = nextInt(p.rng, 0, TILE);
    p.rect(x, y, w, h, t.base);
    p.rect(x + 1, y + h - 1, w - 1, 1, t.shade);
    p.rect(x + w - 1, y + 1, 1, h - 1, t.shade);
    p.px(x, y, t.light);
  }
}

/** Soft ridges (snow, sand, silt): `count` runs up to `len` px long, a light row over a shade row. */
export function ridges(p: Painter, t: Tones, count: number, len: number): void {
  for (let i = 0; i < count; i++) {
    const l = nextInt(p.rng, 3, len + 1);
    const x = nextInt(p.rng, 0, TILE - l + 1);
    const y = nextInt(p.rng, 0, TILE - 1);
    p.rect(x, y, l, 1, t.light);
    p.rect(x, y + 1, l, 1, t.shade);
  }
}

/**
 * Paints a blob region with its edge ring lit the way the light falls (rule 1): a raised region is light
 * along its north and west edge and shaded along the south and east; a sunken one is the reverse, the
 * bank's shadow on its north-west rim and light on the south-east. A flat region takes the shade all round.
 */
export function regionLit(p: Painter, mask: number, inset: number, look: RegionLook): void {
  const inside = (x: number, y: number): boolean => insideBlob(mask, x, y, inset);
  const density = look.density ?? 0;
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      if (!inside(x, y)) continue;
      const up = !inside(x, y - 1);
      const left = !inside(x - 1, y);
      const down = !inside(x, y + 1);
      const right = !inside(x + 1, y);
      if (up || left || down || right) {
        let lit: boolean;
        if (look.relief === 'raised') lit = !(down || right);
        else if (look.relief === 'sunken') lit = !(up || left);
        else lit = false;
        p.px(x, y, lit ? look.light : look.shade);
        continue;
      }
      if (look.speck !== undefined && nextFloat(p.rng) < density) p.px(x, y, look.speck);
      else p.px(x, y, look.base);
    }
  }
}

/** A painter that only marks pixels where `inside` holds: texture confined to a blob's interior. */
export function clip(p: Painter, inside: (x: number, y: number) => boolean): Painter {
  const px = (x: number, y: number, colour: string): void => {
    if (inside(x, y)) p.px(x, y, colour);
  };
  const rect = (x: number, y: number, w: number, h: number, colour: string): void => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) px(xx, yy, colour);
  };
  return {
    r: p.r,
    rng: p.rng,
    px,
    rect,
    fill: (colour) => {
      rect(0, 0, p.r.w, p.r.h, colour);
    },
    speckle: (colour, density) => {
      for (let y = 0; y < p.r.h; y++)
        for (let x = 0; x < p.r.w; x++) if (nextFloat(p.rng) < density) px(x, y, colour);
    },
  };
}
