import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { HRONN } from '@core/actors/enemies/hronn';
import type { Entity } from '@core/actors/entity';
import type { ContentDb } from '@core/sim/db';
import { blast } from '@core/sim/systems/bombs';
import { damageActor } from '@core/sim/systems/combat';
import { giveItem } from '@core/story/effects';
import type { Thing } from '@core/world/screen';
import { Harness } from './harness';

/** test_a as Hrönn's round hall: an open room with the eel's pool in the middle, (20, 11). */
function hall(): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + '#',
  );
  const things: Thing[] = [{ k: 'enemy', id: 'hronn', at: { x: 20, y: 11 } }];
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things } } };
}

function fight(): Harness {
  const h = new Harness({ db: hall(), tile: [20, 19], facing: 'n' });
  giveItem(h.sim, 'bombs', 10);
  h.sim.command({ t: 'god', on: true });
  return h.idle(2);
}

const eel = (h: Harness): Entity => {
  const e = h.sim.enemies.find((a) => a.def === 'hronn');
  if (e === undefined) throw new Error('no Hrönn');
  return e;
};
const grates = (h: Harness) => h.sim.enemies.filter((a) => a.def === 'hronn_grate');
const grateAt = (h: Harness, spot: number) => grates(h).find((m) => m.mem['spot'] === spot);
const hit = (h: Harness, amount: number) =>
  damageActor(h.sim, eel(h), {
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

describe('Hrönn', () => {
  it('wakes under the first of four grates, which bubbles, and is named on the bar', () => {
    const h = fight();
    expect(grates(h)).toHaveLength(4);
    expect(eel(h).fsm.s).toBe('under');
    expect(eel(h).pos).toEqual(grateAt(h, 0)?.pos);
    h.idle(1);
    expect(grates(h).map((m) => m.anim)).toEqual(['bubble', 'idle', 'idle', 'idle']);
    expect(h.sim.boss()?.name.en).toBe('Hrönn');
    h.expectAnims();
  });

  it('surfaces with a tell before it bites, then goes on to the next grate in turn', () => {
    const h = fight();
    ticksUntil(h, () => eel(h).fsm.s === 'surface');
    expect(ticksUntil(h, () => eel(h).anim === 'bite')).toBe(HRONN.surfaceTell);
    ticksUntil(h, () => eel(h).fsm.s === 'under');
    expect(eel(h).mem['in']).toBe(1);
    expect(eel(h).pos).toEqual(grateAt(h, 1)?.pos);
    h.expectAnims();
  });

  it('turns the blade and shrugs off a bomb on another grate', () => {
    const h = fight();
    const before = eel(h).hp;
    const other = grateAt(h, 2);
    if (other === undefined) throw new Error('no grate');
    blast(h.sim, { ...other.pos });
    h.idle(1);
    expect(grateAt(h, 2)).toBeUndefined();
    expect(eel(h).fsm.s).toBe('under');
    hit(h, 4);
    expect(eel(h).hp).toBe(before);
  });

  it('is stunned by a bomb in the grate it is under, open to the blade, then sinks on', () => {
    const h = fight();
    const g = grateAt(h, 0);
    if (g === undefined) throw new Error('no grate');
    blast(h.sim, { ...g.pos });
    h.idle(1);
    expect(eel(h).fsm.s).toBe('stunned');
    hit(h, 2);
    expect(eel(h).hp).toBe(DB.enemies.hronn.hp - 2);
    const open = ticksUntil(h, () => eel(h).fsm.s !== 'stunned');
    expect(open).toBeGreaterThanOrEqual(HRONN.stunTicks - 2);
    expect(eel(h).fsm.s).toBe('sink');
    h.expectAnims();
  });

  it('waits under long enough for a bomb fuse, and less so at half health, with a decoy', () => {
    expect(HRONN.underTicks).toBeGreaterThan(DB.props.bomb.fuse ?? 0);
    expect(HRONN.underTicksLast).toBeGreaterThan(DB.props.bomb.fuse ?? 0);
    const h = fight();
    eel(h).hp = HRONN.phaseAt;
    ticksUntil(h, () => eel(h).fsm.s === 'sink');
    ticksUntil(h, () => eel(h).fsm.s === 'under');
    h.idle(1);
    const decoy = eel(h).mem['decoy'] ?? -1;
    expect(decoy).toBeGreaterThanOrEqual(0);
    expect(grateAt(h, decoy)?.anim).toBe('bubble');
  });

  it('grows a broken grate back once Ask is clear of it', () => {
    const h = fight();
    const g = grateAt(h, 3);
    if (g === undefined) throw new Error('no grate');
    blast(h.sim, { ...g.pos });
    h.idle(HRONN.regrowTicks + 2);
    expect(grateAt(h, 3)).toBeDefined();
  });

  it('dies to the blade over enough stuns', () => {
    const h = fight();
    for (let n = 0; n < 12 && h.sim.enemies.some((a) => a.def === 'hronn'); n++) {
      ticksUntil(h, () => eel(h).fsm.s === 'under');
      const g = grateAt(h, eel(h).mem['in'] ?? 0);
      if (g === undefined) {
        h.idle(HRONN.regrowTicks);
        continue;
      }
      blast(h.sim, { ...g.pos });
      h.idle(1);
      hit(h, 4);
    }
    expect(h.sim.enemies.some((a) => a.def === 'hronn')).toBe(false);
  });
});
