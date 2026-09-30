import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { EnemyId } from '@content/ids';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { Harness, frameOf } from './harness';

/** An open test_a with `id` at (16, 10). */
function arena(id: EnemyId): ContentDb {
  const open = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + '#',
  );
  const things: Thing[] = [{ k: 'enemy', id, at: { x: 16, y: 10 } }];
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map: open, things } } };
}

/** A barrow-wight past its rise, standing at (16, 10) facing `facing`, with Ask beside it. */
function wight(side: 'front' | 'back'): Harness {
  const h = new Harness({ db: arena('haugbui'), tile: [14, 10], facing: 'e' });
  h.sim.hero.hp = 999;
  h.sim.hero.maxHp = 999;
  const e = h.sim.enemies[0];
  if (e === undefined) throw new Error('no wight');
  h.idle(42);
  // Pin it in place (a long stun freezes its behaviour), facing toward Ask (front) or away (back).
  e.fsm = { s: 'stalk', t: 0 };
  e.pos = { x: 15 * 16 + 8, y: h.sim.hero.pos.y };
  e.facing = side === 'front' ? 'w' : 'e';
  e.mem['stun'] = 500;
  return h;
}

const swingOnce = (h: Harness): void => {
  h.step(frameOf(['sword'], ['sword'])).idle(10);
};

describe('barrow-wight', () => {
  it('turns a blow from the front with its shield', () => {
    const h = wight('front');
    const hp = h.sim.enemies[0]?.hp ?? 0;
    swingOnce(h);
    expect(h.sim.enemies[0]?.hp).toBe(hp);
    expect(h.events.some((e) => e.t === 'hit' && e.blocked)).toBe(true);
  });

  it('takes a blow from behind', () => {
    const h = wight('back');
    const hp = h.sim.enemies[0]?.hp ?? 0;
    swingOnce(h);
    expect(h.sim.enemies[0]?.hp).toBeLessThan(hp);
  });

  it('takes a blow from the front while its own blade is out', () => {
    const h = wight('front');
    const e = h.sim.enemies[0];
    if (e === undefined) throw new Error('no wight');
    e.mem['stun'] = 0;
    const hp = e.hp;
    // Shield up through its cut, then strike back while it recovers.
    h.until((s) => s.enemies[0]?.fsm.s === 'recover' && s.enemies[0].fsm.t >= 2, 200, frameOf(['shield']));
    // The blocked cut pushed Ask back: step in again.
    h.sim.hero.pos = { x: e.pos.x - 16, y: e.pos.y };
    h.idle(1).hold(['sword'], 1).idle(8);
    expect(h.sim.enemies[0]?.hp).toBeLessThan(hp);
  });

  it('cannot stop a dash thrust with its shield', () => {
    const h = wight('front');
    h.sim.state.flags.t_dash = true;
    h.sim.hero.pos = { x: 11 * 16 + 8, y: h.sim.hero.pos.y };
    const hp = h.sim.enemies[0]?.hp ?? 0;
    h.step(frameOf(['right', 'roll'], ['roll']));
    for (let i = 0; i < 5; i++) h.step(frameOf(['right']));
    h.step(frameOf(['sword'], ['sword'])).idle(14);
    expect(h.sim.enemies[0]?.hp).toBeLessThan(hp);
    h.expectAnims();
  });

  it('rises from its mound untouchable, then cuts at a shielded Ask to no avail', () => {
    const h = new Harness({ db: arena('haugbui'), tile: [16, 12], facing: 'n' });
    expect(h.sim.enemies[0]?.fsm.s).toBe('rise');
    const hp = h.sim.hero.hp;
    h.hold(['shield'], 240);
    expect(h.sim.hero.hp).toBe(hp);
    expect(h.events.some((e) => e.t === 'hit' && e.target === h.sim.hero.id && e.blocked)).toBe(true);
  });
});
