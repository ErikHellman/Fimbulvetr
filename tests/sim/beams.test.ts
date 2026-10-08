import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { Harness, frameOf } from './harness';

/** Any flag the test room's eyes and windows can use. */
const FLAG = 'st_utgard_open';

/** test_a, walled round, with these things on it (and an optional wall of clear ice at column 30). */
function room(things: readonly Thing[], clear = false): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) => {
    if (y === 0 || y === 21) return '#'.repeat(40);
    const row = ['#', ...Array.from({ length: 38 }, () => '.'), '#'];
    if (clear && y >= 1 && y <= 20) row[30] = '▧';
    return row.join('');
  });
  const screen = { ...DB.screens.test_a, map, things };
  return { ...DB, screens: { ...DB.screens, test_a: screen } };
}

const segs = (h: Harness): number => h.sim.beams().length;

describe('light beams', () => {
  it('shine straight across the room from the window until a wall', () => {
    const h = new Harness({ db: room([{ k: 'beam', at: { x: 5, y: 5 }, dir: 'e' }]), tile: [20, 15] });
    h.idle(2);
    const [s] = h.sim.beams();
    expect(segs(h)).toBe(1);
    expect(s).toEqual({ x0: 5 * 16 + 8, y0: 5 * 16 + 8, x1: 38 * 16 + 8, y1: 5 * 16 + 8 });
  });

  it('turn at a prism and light a crystal eye, which sets its flag for good', () => {
    const things: Thing[] = [
      { k: 'beam', at: { x: 5, y: 5 }, dir: 'e' },
      { k: 'prism', at: { x: 20, y: 5 }, turn: '\\' },
      { k: 'eye', at: { x: 20, y: 15 }, flag: FLAG },
    ];
    const h = new Harness({ db: room(things), tile: [30, 10] });
    h.idle(2);
    expect(segs(h)).toBe(2);
    expect(h.sim.state.flags[FLAG]).toBe(true);
  });

  it('miss the eye while the prism faces the other way, until a sword blow turns it', () => {
    const things: Thing[] = [
      { k: 'beam', at: { x: 5, y: 5 }, dir: 'e' },
      { k: 'prism', at: { x: 20, y: 5 }, turn: '/', turns: true },
      { k: 'eye', at: { x: 20, y: 15 }, flag: FLAG },
    ];
    const h = new Harness({ db: room(things), tile: [21, 5] });
    h.idle(2);
    expect(h.sim.state.flags[FLAG]).toBeUndefined();
    h.step(frameOf(['left'], ['left'])).idle(2);
    h.press(['sword']).idle(30);
    expect(h.sim.state.flags[FLAG]).toBe(true);
  });

  it('shine only while their `when` holds', () => {
    const things: Thing[] = [{ k: 'beam', at: { x: 5, y: 5 }, dir: 'e', when: { k: 'flag', id: FLAG } }];
    const h = new Harness({ db: room(things), tile: [20, 15] });
    h.idle(2);
    expect(segs(h)).toBe(0);
    h.sim.command({ t: 'setFlag', flag: FLAG, value: true });
    h.idle(2);
    expect(segs(h)).toBe(1);
  });

  it('pass through clear ice, which a Bragð beam does not', () => {
    const things: Thing[] = [
      { k: 'beam', at: { x: 5, y: 5 }, dir: 'e' },
      { k: 'eye', at: { x: 34, y: 5 }, flag: FLAG },
    ];
    const h = new Harness({ db: room(things, true), tile: [20, 15] });
    h.idle(2);
    expect(h.sim.state.flags[FLAG]).toBe(true);
  });

  it('a Bragð beam lights an eye it reaches, and turns a prism it strikes', () => {
    const things: Thing[] = [
      { k: 'eye', at: { x: 20, y: 5 }, flag: FLAG },
      { k: 'prism', at: { x: 30, y: 10 }, turn: '/', turns: true },
    ];
    const h = new Harness({ db: room(things), tile: [20, 12] });
    h.sim.state.inv.galdr = ['bragd'];
    h.sim.state.hero.seidr = 20;
    h.step(frameOf(['up'], ['up'])).idle(2);
    h.press(['galdr']).idle(60);
    expect(h.sim.state.flags[FLAG]).toBe(true);
    const prism = h.sim.actors.find((a) => a.def === 'prism');
    expect(prism?.mem['turn'] ?? 0).toBe(0);
    h.step(frameOf(['right'], ['right'])).idle(2);
    h.sim.state.hero.seidr = 20;
    h.idle(30);
    h.sim.command({ t: 'warp', screen: 'test_a', x: 20 * 16 + 8, y: 10 * 16 + 14 });
    h.idle(2);
    h.step(frameOf(['right'], ['right'])).idle(2);
    h.press(['galdr']).idle(60);
    expect(h.sim.actors.find((a) => a.def === 'prism')?.mem['turn']).toBe(1);
  });
});
