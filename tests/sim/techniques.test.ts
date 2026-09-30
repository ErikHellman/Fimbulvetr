import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { Harness, frameOf } from './harness';

/** test_a with the dummy (or a draugr) a few tiles east of Ask. */
function field(things: Thing[]): ContentDb {
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, things } } };
}

const dummy = (h: Harness) => h.sim.enemies[0];

/** Rolls east, then presses the sword `after` ticks into the roll. */
function rollAndStrike(h: Harness, after: number): void {
  h.step(frameOf(['right', 'roll'], ['roll']));
  for (let i = 1; i < after; i++) h.step(frameOf(['right']));
  h.step(frameOf(['right', 'sword'], ['sword']));
}

describe('the dash thrust', () => {
  it('is only a roll without the lesson', () => {
    const h = new Harness({ db: field([]), tile: [10, 10], facing: 'e' });
    rollAndStrike(h, 5);
    expect(h.sim.hero.fsm.s).toBe('roll');
  });

  it('turns a roll into a lunge that strikes twice as hard and reaches further', () => {
    const h = new Harness({ db: field([{ k: 'enemy', id: 'dummy', at: { x: 14, y: 10 } }]), tile: [10, 10] });
    h.sim.state.flags.t_dash = true;
    h.sim.hero.facing = 'e';
    const x0 = h.sim.hero.pos.x;
    rollAndStrike(h, 5);
    expect(h.sim.hero.fsm.s).toBe('thrust');
    expect(h.count('sfx')).toBeGreaterThan(0);
    const before = dummy(h)?.hp ?? 0;
    h.until((s) => s.hero.fsm.s !== 'thrust', 40, frameOf([]));
    const hits = h.events.filter((e) => e.t === 'hit' && e.target === dummy(h)?.id);
    expect(hits.length).toBe(1);
    expect(hits[0]?.t === 'hit' ? hits[0].dealt : 0).toBe(2 * DB.tuning.sword.comboDamage[0]);
    expect(dummy(h)?.hp).toBe(before - 2 * DB.tuning.sword.comboDamage[0]);
    expect(h.sim.hero.pos.x - x0).toBeGreaterThan(40);
    // The roll's cooldown follows the lunge.
    expect(h.sim.hero.mem['rollCd']).toBeGreaterThan(0);
    h.expectAnims();
  });

  it('cannot start in the roll’s first ticks', () => {
    const h = new Harness({ db: field([]), tile: [10, 10], facing: 'e' });
    h.sim.state.flags.t_dash = true;
    rollAndStrike(h, 1);
    expect(h.sim.hero.fsm.s).toBe('roll');
  });
});

/** A draugr a tile east of Ask, Ask facing it; runs until the draugr is `left` ticks from its blow. */
function draugrAboutToSwing(parry: boolean, left: number): Harness {
  const h = new Harness({ db: field([{ k: 'enemy', id: 'draugr', at: { x: 11, y: 10 } }]), tile: [10, 10] });
  if (parry) h.sim.state.flags.t_parry = true;
  h.sim.hero.facing = 'e';
  const tell = 30;
  h.until((s) => s.enemies[0]?.fsm.s === 'tell' && s.enemies[0].fsm.t >= tell - 1 - left, 400);
  return h;
}

describe('the parry', () => {
  it('turns a heavy blow that meets a freshly raised shield, and stuns the foe', () => {
    const h = draugrAboutToSwing(true, 3);
    const hp = h.sim.hero.hp;
    for (let i = 0; i < 12; i++) h.step(frameOf(['shield'], i === 0 ? ['shield'] : []));
    expect(h.sim.hero.hp).toBe(hp);
    expect(h.events.some((e) => e.t === 'sfx' && e.id === 'sfx_parry')).toBe(true);
    const d = h.sim.enemies[0];
    expect(d?.mem['stun']).toBeGreaterThan(40);
    // The rest of its swing is spent: when the stun ends it does not land.
    h.until((s) => (s.enemies[0]?.mem['stun'] ?? 0) === 0, 80, frameOf(['shield']));
    h.idle(10);
    expect(h.sim.hero.hp).toBe(hp);
  });

  it('is only the shield (a heavy blow staggers through) outside the window', () => {
    // Raised long before the blow.
    const pre = draugrAboutToSwing(true, 20);
    const hp = pre.sim.hero.hp;
    for (let i = 0; i < 30; i++) pre.step(frameOf(['shield'], i === 0 ? ['shield'] : []));
    expect(pre.sim.hero.hp).toBeLessThan(hp);
    expect(pre.events.some((e) => e.t === 'sfx' && e.id === 'sfx_parry')).toBe(false);
  });

  it('needs the lesson', () => {
    const h = draugrAboutToSwing(false, 3);
    const hp = h.sim.hero.hp;
    for (let i = 0; i < 12; i++) h.step(frameOf(['shield'], i === 0 ? ['shield'] : []));
    expect(h.sim.hero.hp).toBeLessThan(hp);
  });
});
