import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { Harness } from './harness';

/**
 * An open room with a moat of water down columns 24–26 (rows 1–20), `rows` of extra map text laid over
 * rows from 1, and `things`.
 */
function room(things: Thing[], rows: Record<number, string> = {}): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) => {
    if (y === 0 || y === 21) return '#'.repeat(40);
    return rows[y] ?? '#' + '.'.repeat(23) + '~~~' + '.'.repeat(12) + '#';
  });
  const screen = { ...DB.screens.test_a, map, things };
  return { ...DB, screens: { ...DB.screens, test_a: screen } };
}

function thrower(db: ContentDb, tile: readonly [number, number] = [20, 10], season?: 'autumn'): Harness {
  const h = new Harness({ db, tile, facing: 'e', ...(season === undefined ? {} : { season }) });
  h.sim.state.inv.items.boomerang = 1;
  h.sim.state.inv.slots = ['boomerang', null];
  return h;
}

const flying = (h: Harness) => h.sim.actors.filter((a) => a.kind === 'projectile');

describe('the boomerang', () => {
  it('flies out, turns and comes back to hand; one at a time', () => {
    const h = thrower(room([]));
    h.press(['item1']);
    expect(flying(h)).toHaveLength(1);
    expect(h.sim.hero.fsm.s).toBe('toss');
    expect(h.events).toContainEqual({ t: 'sfx', id: 'sfx_boomerang' });
    let far = 0;
    for (let i = 0; i < 20; i++) {
      h.idle(1);
      far = Math.max(far, flying(h)[0]?.pos.x ?? 0);
    }
    h.press(['item1']);
    expect(flying(h)).toHaveLength(1);
    h.until((s) => {
      far = Math.max(far, s.actors.find((a) => a.kind === 'projectile')?.pos.x ?? 0);
      return !s.actors.some((a) => a.kind === 'projectile');
    }, 200);
    // It crossed the moat: water is no wall to it.
    expect(far).toBeGreaterThan(27 * 16);
    expect(h.sim.hero.fsm.s).toBe('move');
  });

  it('turns back at a wall', () => {
    const wall = '#' + '.'.repeat(22) + '#' + '.'.repeat(15) + '#';
    const h = thrower(room([], { 10: wall }));
    h.press(['item1']);
    let far = 0;
    h.until((s) => {
      far = Math.max(far, s.actors.find((a) => a.kind === 'projectile')?.pos.x ?? 0);
      return !s.actors.some((a) => a.kind === 'projectile');
    }, 200);
    expect(far).toBeLessThan(23 * 16);
  });

  it('stuns what it strikes without killing it', () => {
    const h = thrower(room([{ k: 'enemy', id: 'vargr', at: { x: 23, y: 10 } }]));
    h.sim.command({ t: 'god', on: true });
    h.press(['item1']);
    h.until((s) => (s.enemies[0]?.mem['stun'] ?? 0) > 0, 60);
    const vargr = h.sim.enemies[0];
    expect(vargr?.hp).toBe(vargr?.maxHp);
    expect(h.events).toContainEqual({ t: 'sfx', id: 'sfx_stun' });
  });

  it('lights a switch across the water', () => {
    const h = thrower(room([{ k: 'switch', at: { x: 28, y: 10 } }]));
    h.press(['item1']).idle(60);
    expect(h.sim.actors.find((a) => a.def === 'switch')?.anim).toBe('on');
  });

  it('fetches a piece of heart from across the water', () => {
    const h = thrower(room([{ k: 'piece', id: 'hp_test', at: { x: 28, y: 10 } }]));
    h.press(['item1']);
    h.until((s) => s.state.world.pieces.includes('hp_test'), 200);
    expect(h.sim.hero.pos.x).toBeLessThan(21 * 16);
  });

  it('blows leaves away but leaves the grass standing', () => {
    const leafy = '#' + '.'.repeat(20) + '%%""' + '.'.repeat(14) + '#';
    const h = thrower(room([], { 10: leafy }), [19, 10], 'autumn');
    h.press(['item1']).idle(80);
    const cover = h.sim.screen.cover;
    expect([21, 22].map((x) => cover.cleared[10 * 40 + x])).toEqual([1, 1]);
    expect(h.events).toContainEqual({ t: 'coverChanged', screen: 'test_a' });
  });
});
