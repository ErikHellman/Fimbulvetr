import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { ROTVAETTR } from '@core/actors/enemies/rotvaettr';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { Harness } from './harness';
import { face, walkTo } from './walk';

/** An open d1 room with Rótvættr at (20,5). */
function lair(): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + '#',
  );
  const things: Thing[] = [{ k: 'enemy', id: 'rotvaettr', at: { x: 20, y: 5 } }];
  const screen = { ...DB.screens.test_a, map, things, dungeon: 'd1' as const };
  return { ...DB, screens: { ...DB.screens, test_a: screen } };
}

function fight(): Harness {
  const h = new Harness({ db: lair(), tile: [20, 12], facing: 'n' });
  h.sim.command({ t: 'god', on: true });
  h.idle(2);
  return h;
}

const core = (h: Harness) => {
  const e = h.sim.enemies.find((a) => a.def === 'rotvaettr');
  if (e === undefined) throw new Error('no Rótvættr');
  return e;
};
const bulbs = (h: Harness) => h.sim.enemies.filter((a) => a.def === 'rot_bulb');
const stunAll = (h: Harness, n = 3): void => {
  for (const b of bulbs(h).slice(0, n)) b.mem['stun'] = 200;
};
/** Walks under the core and swings a few times. */
function strike(h: Harness, swings = 4): void {
  walkTo(h, 20, 7);
  face(h, 'n');
  for (let i = 0; i < swings; i++) h.press(['sword']).idle(6);
}

describe('Rótvættr', () => {
  it('wakes with three bulbs about it and a name on the boss bar', () => {
    const h = fight();
    expect(bulbs(h)).toHaveLength(3);
    expect(h.sim.boss()).toMatchObject({ name: { en: 'Rótvættr' }, hp: 24, maxHp: 24, phase: 0 });
  });

  it('keeps its core shut until every bulb is stunned', () => {
    const h = fight();
    stunAll(h, 2);
    strike(h);
    expect(core(h).hp).toBe(24);
    const onCore = h.events.filter((e) => e.t === 'hit' && e.target === core(h).id);
    expect(onCore.length).toBeGreaterThan(0);
    expect(onCore.every((e) => e.t === 'hit' && e.blocked)).toBe(true);
    expect(h.events).toContainEqual({ t: 'sfx', id: 'sfx_block' });
    stunAll(h);
    h.idle(1);
    expect(core(h).fsm.s).toBe('open');
    strike(h, 2);
    expect(core(h).hp).toBeLessThan(24);
  });

  it('opens for a while, then shuts until the bulbs wake and are stunned again', () => {
    const h = fight();
    stunAll(h);
    h.idle(1);
    expect(core(h).fsm.s).toBe('open');
    h.idle(ROTVAETTR.openTicks);
    expect(core(h).fsm.s).toBe('guard');
    stunAll(h);
    h.idle(5);
    expect(core(h).fsm.s).toBe('guard');
    for (const b of bulbs(h)) b.mem['stun'] = 0;
    h.idle(1);
    stunAll(h);
    h.idle(1);
    expect(core(h).fsm.s).toBe('open');
  });

  it('roars into a second phase: its bulbs wake sooner, and root-biters come', () => {
    const h = fight();
    const stunFor = () => bulbs(h)[0]?.mem['stunFor'];
    const first = stunFor();
    stunAll(h);
    h.idle(1);
    core(h).hp = 17;
    strike(h, 1);
    expect(h.sim.boss()?.phase).toBe(1);
    expect(core(h).fsm.s).toBe('roar');
    expect(h.events).toContainEqual({ t: 'sfx', id: 'sfx_boss_roar' });
    // Stunned bulbs sleep through it; awake, they learn the new pace.
    for (const b of bulbs(h)) b.mem['stun'] = 0;
    h.idle(2);
    expect(stunFor()).toBeLessThan(first ?? 0);
    h.until((s) => s.enemies.some((e) => e.def === 'root_biter'), ROTVAETTR.summonTicks + 60);
  });

  it('raises root spikes under Ask in the third phase, each with a fair warning', () => {
    const h = fight();
    core(h).hp = 8;
    core(h).mem['phase'] = 1;
    stunAll(h);
    h.idle(1);
    strike(h, 1);
    expect(h.sim.boss()?.phase).toBe(2);
    h.until((s) => s.enemies.some((e) => e.def === 'root_spike'), ROTVAETTR.spikeTicks + 80).idle(1);
    const spike = h.sim.enemies.find((e) => e.def === 'root_spike');
    expect(spike?.anim).toBe('tell');
    expect(h.sim.db.enemies.root_spike.attacks?.['erupt']).toBeDefined();
  });

  it('takes its bulbs and its brood with it when it dies', () => {
    const h = fight();
    core(h).hp = 1;
    core(h).mem['phase'] = 2;
    stunAll(h);
    h.idle(1);
    strike(h, 2);
    expect(h.sim.enemies).toHaveLength(0);
    expect(h.sim.boss()).toBeNull();
    expect(h.events).toContainEqual({ t: 'bossDead' });
  });
});
