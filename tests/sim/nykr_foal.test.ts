import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { NYKR_FOAL } from '@core/actors/enemies/nykr_foal';
import { TILE } from '@core/world/dims';
import { Harness, frameOf } from './harness';

/** A pond (cols 14–25, rows 6–15) in a grass field, with a foal in it. */
function pond(): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) => {
    if (y === 0 || y === 21) return '#'.repeat(40);
    const wet = y >= 6 && y <= 15;
    return '#' + '.'.repeat(13) + (wet ? '~' : '.').repeat(12) + '.'.repeat(13) + '#';
  });
  const things: Thing[] = [{ k: 'enemy', id: 'nykr_foal', at: { x: 19, y: 10 } }];
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things } } };
}

const foal = (h: Harness) => {
  const e = h.sim.enemies.find((a) => a.def === 'nykr_foal');
  if (e === undefined) throw new Error('no foal');
  return e;
};
const inWater = (x: number, y: number) => {
  const tx = Math.floor(x / TILE);
  const ty = Math.floor((y - 1) / TILE);
  return tx >= 14 && tx <= 25 && ty >= 6 && ty <= 15;
};

describe('the nykr foal', () => {
  it('circles under the water out of reach while Ask is far off', () => {
    const h = new Harness({ db: pond(), tile: [3, 10], facing: 'e' });
    const seen = new Set<string>();
    for (let i = 0; i < 240; i++) {
      h.idle(1);
      const e = foal(h);
      expect(e.fsm.s).toBe('circle');
      expect(inWater(e.pos.x, e.pos.y)).toBe(true);
      seen.add(`${String(Math.floor(e.pos.x / 8))},${String(Math.floor(e.pos.y / 8))}`);
    }
    expect(seen.size).toBeGreaterThan(6);
    expect(foal(h).iframes).toBeGreaterThan(0);
  });

  it('rears when Ask comes to the bank, lunges out onto it and flounders there', () => {
    const h = new Harness({ db: pond(), tile: [12, 10], facing: 'e' });
    h.until(() => foal(h).fsm.s === 'rear', 400);
    expect(NYKR_FOAL.rearTicks).toBeGreaterThanOrEqual(18);
    h.until(() => foal(h).fsm.s === 'lunge', NYKR_FOAL.rearTicks + 2);
    h.until(() => foal(h).fsm.s !== 'lunge', NYKR_FOAL.lungeTicks + 2);
    expect(foal(h).fsm.s).toBe('flounder');
    expect(inWater(foal(h).pos.x, foal(h).pos.y)).toBe(false);
    h.expectAnims();
  });

  it('falls to the blade while it flounders on the bank', () => {
    const h = new Harness({ db: pond(), tile: [12, 10], facing: 'e' });
    h.until(() => foal(h).fsm.s === 'flounder', 600);
    for (let i = 0; i < 20 && h.sim.enemies.length > 0; i++) {
      const e = foal(h);
      h.sim.hero.pos = { x: e.pos.x - 14, y: e.pos.y };
      h.step(frameOf(['right'], ['right']))
        .step(frameOf([], ['sword']))
        .idle(16);
    }
    expect(h.sim.enemies.some((a) => a.def === 'nykr_foal')).toBe(false);
  });

  it('goes back under the water if left alone', () => {
    const h = new Harness({ db: pond(), tile: [12, 10], facing: 'e' });
    h.until(() => foal(h).fsm.s === 'flounder', 600);
    h.sim.hero.pos = { x: 3 * TILE + 8, y: 10 * TILE + 14 };
    h.until(() => foal(h).fsm.s === 'circle', NYKR_FOAL.flounderTicks + 400);
    expect(inWater(foal(h).pos.x, foal(h).pos.y)).toBe(true);
  });
});
