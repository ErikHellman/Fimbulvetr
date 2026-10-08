import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import { shoot } from '@core/sim/systems/projectiles';
import type { Thing } from '@core/world/screen';
import { Harness, frameOf } from './harness';

const FLAG = 'st_utgard_open';

function room(things: readonly Thing[]): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) => {
    if (y === 0 || y === 21) return '#'.repeat(40);
    return ['#', ...Array.from({ length: 38 }, () => '.'), '#'].join('');
  });
  const screen = { ...DB.screens.test_a, map, things };
  return { ...DB, screens: { ...DB.screens, test_a: screen } };
}

/** Ask holding the mirror in slot K on test_a at (tx, ty). */
function withMirror(things: readonly Thing[], tx: number, ty: number): Harness {
  const h = new Harness({ db: room(things), tile: [tx, ty] });
  h.sim.state.inv.items.mirror = 1;
  h.sim.command({ t: 'equip', slot: 0, item: 'mirror' });
  h.idle(1);
  return h;
}

/** Holds the mirror up (slot K) for `ticks`, with `also` held too, without letting go. */
function raise(h: Harness, ticks: number, also: readonly ('up' | 'down' | 'left' | 'right')[] = []): void {
  for (let i = 0; i < ticks; i++) h.step(frameOf(['item1', ...also], i === 0 ? ['item1'] : []));
}

describe('the ice mirror', () => {
  it('stands Ask still behind it while the item key is held, turning but not walking', () => {
    const h = withMirror([], 20, 10);
    const x = h.sim.hero.pos.x;
    raise(h, 4);
    expect(h.sim.hero.fsm.s).toBe('mirror');
    raise(h, 10, ['right']);
    expect(h.sim.hero.facing).toBe('e');
    expect(h.sim.hero.pos.x).toBe(x);
    h.idle(2);
    expect(h.sim.hero.fsm.s).toBe('move');
  });

  it('sends a beam on the way Ask faces, onto an eye no beam reaches alone', () => {
    const things: Thing[] = [
      { k: 'beam', at: { x: 5, y: 10 }, dir: 'e' },
      { k: 'eye', at: { x: 20, y: 3 }, flag: FLAG },
    ];
    const h = withMirror(things, 20, 10);
    h.idle(2);
    expect(h.sim.state.flags[FLAG]).toBeUndefined();
    raise(h, 6, ['up']);
    expect(h.sim.state.flags[FLAG]).toBe(true);
    expect(h.sim.beams().length).toBe(2);
  });

  it('sends a rime bolt back the way Ask faces, to hurt the foe it meets', () => {
    const h = withMirror([], 20, 10);
    h.step(frameOf(['left'], ['left'])).idle(2);
    raise(h, 2);
    const hp = h.sim.hero.hp;
    shoot(h.sim, 'bolt', { x: 10 * 16 + 8, y: 10 * 16 + 4 }, { x: 1, y: 0 });
    raise(h, 60);
    expect(h.sim.hero.hp).toBe(hp);
    const bolt = h.sim.actors.find((a) => a.def === 'bolt');
    expect(bolt?.mem['mine']).toBe(1);
    expect(bolt?.mem['dx']).toBe(-1);
  });

  it('turns a frost wisp’s own bolt back on it, and the wisp dies of it', () => {
    const h = withMirror([{ k: 'enemy', id: 'frostvaettr', at: { x: 8, y: 10 } }], 20, 10);
    h.step(frameOf(['left'], ['left'])).idle(2);
    raise(h, 400);
    expect(h.sim.enemies.some((e) => e.def === 'frostvaettr')).toBe(false);
  });

  it('does not save Ask from a bolt that comes from behind', () => {
    const h = withMirror([], 20, 10);
    h.step(frameOf(['right'], ['right'])).idle(2);
    raise(h, 2);
    const hp = h.sim.hero.hp;
    shoot(h.sim, 'bolt', { x: 10 * 16 + 8, y: 10 * 16 + 4 }, { x: 1, y: 0 });
    raise(h, 60);
    expect(h.sim.hero.hp).toBeLessThan(hp);
  });
});
