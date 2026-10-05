import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { NYKR } from '@core/actors/enemies/nykr';
import type { Entity } from '@core/actors/entity';
import type { ContentDb } from '@core/sim/db';
import { damageActor } from '@core/sim/systems/combat';
import type { Thing } from '@core/world/screen';
import { Harness } from './harness';

/** test_a as Nykr's pool: deep water (cols 6–33, rows 4–17) round a stone island (cols 15–24, rows 8–13). */
function pool(): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) => {
    if (y === 0 || y === 21) return '#'.repeat(40);
    if (y < 4 || y > 17) return '#' + '.'.repeat(38) + '#';
    const row = '#' + '.'.repeat(5) + '~'.repeat(28) + '.'.repeat(5) + '#';
    return y >= 8 && y <= 13 ? row.slice(0, 15) + '.'.repeat(10) + row.slice(25) : row;
  });
  const things: Thing[] = [{ k: 'enemy', id: 'nykr', at: { x: 20, y: 10 } }];
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things } } };
}

function fight(): Harness {
  const h = new Harness({ db: pool(), tile: [20, 13], facing: 'n' });
  h.sim.state.inv.items.sealskin = 1;
  h.sim.command({ t: 'god', on: true });
  return h.idle(2);
}

const nykr = (h: Harness): Entity => {
  const e = h.sim.enemies.find((a) => a.def === 'nykr');
  if (e === undefined) throw new Error('no Nykr');
  return e;
};
const hit = (h: Harness, amount: number) =>
  damageActor(h.sim, nykr(h), {
    amount,
    element: 'none',
    knock: 0,
    dir: { x: 0, y: 1 },
    faction: 'hero',
    tags: 0,
  });

function ticksUntil(h: Harness, pred: () => boolean, max = 900): number {
  for (let t = 0; t < max; t++) {
    if (pred()) return t;
    h.idle(1);
  }
  throw new Error('never');
}

/** Whether a position lies on the island (cols 15–24, rows 8–13). */
const onIsland = (p: { x: number; y: number }): boolean =>
  p.x >= 15 * 16 && p.x < 25 * 16 && p.y >= 8 * 16 && p.y < 14 * 16;

describe('Nykr, the Tide', () => {
  it('rises, roars, and circles the island out in the water, where no blade reaches it', () => {
    const h = fight();
    expect(h.sim.boss()?.name.en).toBe('Nykr');
    ticksUntil(h, () => nykr(h).fsm.s === 'circle');
    h.idle(40);
    expect(onIsland(nykr(h).pos)).toBe(false);
    const hp = nykr(h).hp;
    hit(h, 4);
    expect(nykr(h).hp).toBe(hp);
    h.expectAnims();
  });

  it('rears with a tell, and without a gust surges a wave across the island and circles on', () => {
    const h = fight();
    ticksUntil(h, () => nykr(h).fsm.s === 'rear');
    expect(ticksUntil(h, () => nykr(h).fsm.s !== 'rear')).toBe(NYKR.rearTell);
    expect(nykr(h).fsm.s).toBe('wave');
    ticksUntil(h, () => nykr(h).fsm.s === 'circle');
  });

  it('is blown onto the stone by a gust while it rears, and flounders there open to the blade', () => {
    const h = fight();
    ticksUntil(h, () => nykr(h).fsm.s === 'rear');
    nykr(h).mem['gust'] = 1;
    h.idle(1);
    expect(nykr(h).fsm.s).toBe('beached');
    h.idle(NYKR.slideTicks + 1);
    expect(onIsland(nykr(h).pos)).toBe(true);
    hit(h, 2);
    expect(nykr(h).hp).toBe(DB.enemies.nykr.hp - 2);
    const open = ticksUntil(h, () => nykr(h).fsm.s !== 'beached');
    expect(open).toBeGreaterThan(NYKR.beachTicks - NYKR.slideTicks - 4);
    ticksUntil(h, () => nykr(h).fsm.s === 'circle');
    h.expectAnims();
  });

  it('ignores a gust while it circles', () => {
    const h = fight();
    ticksUntil(h, () => nykr(h).fsm.s === 'circle');
    nykr(h).mem['gust'] = 1;
    h.idle(1);
    expect(nykr(h).fsm.s).toBe('circle');
    expect(nykr(h).mem['gust']).toBe(0);
  });

  it('roars into its second phase at 20 and charges at Ask in a locked line, then rears', () => {
    const h = fight();
    ticksUntil(h, () => nykr(h).fsm.s === 'rear');
    nykr(h).mem['gust'] = 1;
    h.idle(NYKR.slideTicks + 2);
    hit(h, DB.enemies.nykr.hp - NYKR.phaseAt[0]);
    ticksUntil(h, () => nykr(h).fsm.s === 'roar');
    ticksUntil(h, () => nykr(h).fsm.s === 'coil');
    ticksUntil(h, () => nykr(h).fsm.s === 'charge');
    ticksUntil(h, () => nykr(h).fsm.s === 'rear');
    h.expectAnims();
  });

  it('whirls in its last phase, and the grapple on its bridle drags it onto the stone', () => {
    const h = fight();
    nykr(h).hp = NYKR.phaseAt[1];
    nykr(h).mem['phase'] = 2;
    ticksUntil(h, () => nykr(h).fsm.s === 'whirl');
    nykr(h).mem['gust'] = 1;
    h.idle(2);
    expect(nykr(h).fsm.s).toBe('whirl');
    nykr(h).mem['hooked'] = 1;
    h.idle(1);
    expect(nykr(h).fsm.s).toBe('beached');
    h.idle(NYKR.slideTicks + 1);
    expect(onIsland(nykr(h).pos)).toBe(true);
    h.expectAnims();
  });

  it('dies to the blade, phase by phase', () => {
    const h = fight();
    for (let n = 0; n < 400 && h.sim.enemies.some((a) => a.def === 'nykr'); n++) {
      const e = nykr(h);
      if (e.fsm.s === 'beached') {
        hit(h, 4);
        h.idle(30);
        continue;
      }
      if (e.fsm.s === 'rear') e.mem['gust'] = 1;
      if (e.fsm.s === 'whirl') e.mem['hooked'] = 1;
      h.idle(10);
    }
    expect(h.sim.enemies.some((a) => a.def === 'nykr')).toBe(false);
  });
});
