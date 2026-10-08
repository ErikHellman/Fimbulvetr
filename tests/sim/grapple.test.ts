import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { mem } from '@core/actors/entity';
import { Harness } from './harness';

/**
 * An open room with a moat of water down columns 24–26 (rows 1–20), `rows` of extra map text laid over
 * rows from 1, and `things`.
 */
function room(things: Thing[], rows: Record<number, string> = {}, light = false): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) => {
    if (y === 0 || y === 21) return '#'.repeat(40);
    return rows[y] ?? '#' + '.'.repeat(23) + '~~~' + '.'.repeat(12) + '#';
  });
  const screen = { ...DB.screens.test_a, map, things };
  const enemies = light
    ? { ...DB.enemies, vargr: { ...DB.enemies.vargr, light: true as const } }
    : DB.enemies;
  return { ...DB, enemies, screens: { ...DB.screens, test_a: screen } };
}

function grappler(db: ContentDb, tile: readonly [number, number] = [21, 10]): Harness {
  const h = new Harness({ db, tile, facing: 'e' });
  h.sim.state.inv.items.grapple = 1;
  h.sim.state.inv.slots = ['grapple', null];
  return h;
}

const chains = (h: Harness) => h.sim.actors.filter((a) => a.kind === 'projectile' && a.def === 'grapple');
const tileOf = (h: Harness) => [Math.floor(h.sim.hero.pos.x / 16), Math.floor((h.sim.hero.pos.y - 1) / 16)];

describe('the grapple chain', () => {
  it('flies out six tiles and reels back in, Ask standing still meanwhile; one at a time', () => {
    const h = grappler(room([]), [10, 10]);
    const x0 = h.sim.hero.pos.x;
    h.press(['item1']);
    expect(chains(h)).toHaveLength(1);
    expect(h.sim.hero.fsm.s).toBe('chain');
    expect(h.events).toContainEqual({ t: 'sfx', id: 'sfx_chain' });
    expect(h.sim.grapple()).not.toBeNull();
    let far = 0;
    h.press(['item1']);
    expect(chains(h)).toHaveLength(1);
    h.until((s) => {
      far = Math.max(far, s.actors.find((a) => a.def === 'grapple')?.pos.x ?? 0);
      return !s.actors.some((a) => a.def === 'grapple');
    }, 200);
    expect(far - x0).toBeGreaterThan(80);
    // Six tiles from where it leaves the hand, a few px in front of Ask.
    expect(far - x0).toBeLessThanOrEqual(6 * 16 + 8);
    expect(h.sim.hero.pos.x).toBe(x0);
    expect(h.sim.hero.fsm.s).toBe('move');
    expect(h.sim.grapple()).toBeNull();
  });

  it('hooks a post across the water and pulls Ask to the tile before it', () => {
    const h = grappler(room([{ k: 'post', at: { x: 27, y: 10 } }]));
    h.press(['item1']);
    h.until((s) => s.hero.fsm.s === 'move' && !s.actors.some((a) => a.def === 'grapple'), 200);
    expect(tileOf(h)).toEqual([26, 10]);
  });

  it('a post is solid ground for nobody: Ask cannot walk through it', () => {
    const h = grappler(room([{ k: 'post', at: { x: 22, y: 10 } }]));
    h.hold(['right'], 30);
    expect(h.sim.hero.pos.x).toBeLessThan(22 * 16);
  });

  it('a post out of reach is not hooked', () => {
    const h = grappler(room([{ k: 'post', at: { x: 29, y: 10 } }]));
    h.press(['item1']);
    h.until((s) => !s.actors.some((a) => a.def === 'grapple'), 200);
    expect(tileOf(h)).toEqual([21, 10]);
  });

  it('turns back at a wall', () => {
    const wall = '#' + '.'.repeat(22) + '#' + '.'.repeat(15) + '#';
    const h = grappler(room([{ k: 'post', at: { x: 26, y: 10 } }], { 10: wall }), [20, 10]);
    h.press(['item1']);
    let far = 0;
    h.until((s) => {
      far = Math.max(far, s.actors.find((a) => a.def === 'grapple')?.pos.x ?? 0);
      return !s.actors.some((a) => a.def === 'grapple');
    }, 200);
    expect(far).toBeLessThan(23 * 16);
    expect(tileOf(h)).toEqual([20, 10]);
  });

  it('drags a light foe to Ask and stuns it', () => {
    const h = grappler(room([{ k: 'enemy', id: 'vargr', at: { x: 27, y: 10 } }], {}, true));
    const foe = () => h.sim.actors.find((a) => a.kind === 'enemy');
    h.press(['item1']);
    h.until((s) => !s.actors.some((a) => a.def === 'grapple'), 200);
    expect(foe()?.pos.x ?? 999).toBeLessThan(24 * 16);
    expect(mem(foe() ?? h.sim.hero, 'stun')).toBeGreaterThan(0);
  });

  it('only hooks a heavy foe: it stays put, marked for its behaviour', () => {
    const h = grappler(room([{ k: 'enemy', id: 'vargr', at: { x: 27, y: 10 } }]));
    const foe = () => h.sim.actors.find((a) => a.kind === 'enemy');
    h.press(['item1']);
    h.until((s) => {
      const f = s.actors.find((a) => a.kind === 'enemy');
      return f !== undefined && mem(f, 'hooked') === 1;
    }, 60);
    expect(foe()?.pos.x ?? 0).toBeGreaterThan(26 * 16);
  });

  it('fetches a piece of heart from across the water', () => {
    const h = grappler(room([{ k: 'piece', id: 'hp_test', at: { x: 27, y: 10 } }]));
    h.press(['item1']);
    h.until((s) => s.state.world.pieces.includes('hp_test'), 200);
    expect(tileOf(h)).toEqual([21, 10]);
  });

  it('lights a switch', () => {
    const h = grappler(room([{ k: 'switch', at: { x: 26, y: 10 } }]));
    h.press(['item1']);
    h.until((s) => s.actors.some((a) => a.def === 'switch' && mem(a, 'lit') === 1), 60);
  });

  it('a blow on Ask drops the chain', () => {
    const h = grappler(room([]), [10, 10]);
    h.press(['item1']).idle(2);
    h.sim.hero.fsm = { s: 'hurt', t: 0 };
    h.idle(1);
    expect(chains(h)).toHaveLength(0);
  });
});
