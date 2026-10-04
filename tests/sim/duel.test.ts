import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { HUSCARL } from '@core/actors/enemies/huscarl';
import type { ContentDb } from '@core/sim/db';
import { DUEL_FLOOR } from '@core/sim/systems/combat';
import type { Thing } from '@core/world/screen';
import { Harness, frameOf } from './harness';

/** test_a with Styrr a tile east of Ask, as a duel that sets `q_duel_won` when he yields. */
function yard(): ContentDb {
  const things: Thing[] = [
    {
      k: 'enemy',
      id: 'styrr_duel',
      at: { x: 11, y: 10 },
      onDeath: [
        { k: 'set', flag: 'q_duel_won', value: true },
        { k: 'set', flag: 'ev_duel_on', value: false },
      ],
    },
  ];
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, things } } };
}

function duel(): Harness {
  const h = new Harness({ db: yard(), tile: [10, 10], facing: 'e' });
  h.sim.state.flags.ev_duel_on = true;
  return h;
}

const styrr = (h: Harness) => h.sim.enemies[0];

describe('Styrr’s duel', () => {
  it('turns a plain blow on his shield, but the dash thrust gets through', () => {
    const h = duel();
    h.step(frameOf(['sword'], ['sword'])).idle(20);
    expect(h.events.some((e) => e.t === 'hit' && e.target === styrr(h)?.id && e.blocked)).toBe(true);
    expect(styrr(h)?.hp).toBe(12);
    h.expectAnims();

    const t = duel();
    t.sim.state.flags.t_dash = true;
    t.sim.hero.pos = { x: t.sim.hero.pos.x - 32, y: t.sim.hero.pos.y };
    t.step(frameOf(['right', 'roll'], ['roll']));
    for (let i = 1; i < 5; i++) t.step(frameOf(['right']));
    t.step(frameOf(['right', 'sword'], ['sword'])).idle(20);
    expect(styrr(t)?.hp).toBeLessThan(12);
  });

  it('worn down, he winds up a heavy blow that a parry turns, leaving him stunned and open', () => {
    const h = duel();
    h.sim.state.flags.t_parry = true;
    const s = styrr(h);
    if (s === undefined) throw new Error('no Styrr');
    s.hp = HUSCARL.heavyAt;
    h.until((sim) => sim.enemies[0]?.fsm.s === 'wind', 200);
    expect(h.sim.enemies[0]?.anim).toBe('wind');
    h.until((sim) => (sim.enemies[0]?.fsm.t ?? 0) >= HUSCARL.windTicks - 4, 40);
    const hp = h.sim.hero.hp;
    for (let i = 0; i < 10; i++) h.step(frameOf(['shield'], i === 0 ? ['shield'] : []));
    expect(h.sim.hero.hp).toBe(hp);
    expect(h.events.some((e) => e.t === 'sfx' && e.id === 'sfx_parry')).toBe(true);
    expect(styrr(h)?.mem['stun']).toBeGreaterThan(45);
    expect(styrr(h)?.mem['open']).toBe(1);
    // Open: a plain blow from the front lands now.
    h.step(frameOf([], []))
      .step(frameOf(['sword'], ['sword']))
      .idle(10);
    expect(styrr(h)?.hp).toBeLessThan(HUSCARL.heavyAt);
  });

  it('staggers through a shield raised too early', () => {
    const h = duel();
    const s = styrr(h);
    if (s === undefined) throw new Error('no Styrr');
    s.hp = HUSCARL.heavyAt;
    const hp = h.sim.hero.hp;
    h.until((sim) => sim.enemies[0]?.fsm.s === 'heavy' && sim.enemies[0].fsm.t > 8, 300, frameOf(['shield']));
    expect(h.sim.hero.hp).toBeLessThan(hp);
  });

  it('ends at one heart: Styrr steps back, Ask’s hearts refill and the duel can be tried again', () => {
    const h = duel();
    h.sim.state.hero.hp = DUEL_FLOOR + 1;
    h.until((sim) => sim.enemies.length === 0, 400);
    expect(h.sim.state.hero.hp).toBe(h.sim.state.hero.maxHp);
    expect(h.sim.state.flags.ev_duel_on).toBe(false);
    expect(h.sim.state.flags.q_duel_won).not.toBe(true);
    h.idle(1);
    expect(h.sim.storyUi()).not.toBeNull();
    expect(h.events.some((e) => e.t === 'gameOver')).toBe(false);
  });

  it('is won when he yields: no smoke, nothing dropped, and the win is recorded', () => {
    const h = duel();
    const s = styrr(h);
    if (s === undefined) throw new Error('no Styrr');
    s.hp = 1;
    s.mem['open'] = 1;
    h.step(frameOf(['sword'], ['sword'])).idle(10);
    expect(h.sim.enemies.length).toBe(0);
    expect(h.sim.state.flags.q_duel_won).toBe(true);
    expect(h.events.some((e) => e.t === 'killed')).toBe(false);
    expect(h.sim.entities.some((e) => e.kind === 'pickup')).toBe(false);
  });

  it('is forfeit by leaving the screen', () => {
    const h = new Harness({ db: yard(), tile: [38, 10], facing: 'e' });
    h.sim.state.flags.ev_duel_on = true;
    h.until((sim) => sim.screen.id !== 'test_a', 120, frameOf(['right']));
    expect(h.sim.state.flags.ev_duel_on).toBe(false);
  });
});
