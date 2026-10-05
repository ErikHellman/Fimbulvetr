import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { WORLD_LAYOUT as LAYOUT } from '@content/world/layout';
import { SCREENS } from '@content/world/registry';
import { SCREEN_IDS, type ScreenId } from '@content/world/screens';
import { parseTextMap } from '@core/world/textmap';

const rooms = SCREEN_IDS.filter((id) => SCREENS[id].dungeon === 'd8');

const grid = (id: ScreenId) => parseTextMap(SCREENS[id].map, DB.legend);
const open = (id: ScreenId, x: number, y: number): boolean => {
  const g = grid(id);
  const t = g.cells[y * g.cols + x];
  return t !== undefined && !DB.terrain[t].solid;
};
const things = (k: string) =>
  rooms.flatMap((id) => SCREENS[id].things.flatMap((t) => (t.k === k ? [{ id, t }] : [])));

describe('Útgarðr', () => {
  it('has forty rooms on Hrímfjöll, none of them cold, on an eight by five grid', () => {
    expect(rooms).toHaveLength(40);
    for (const id of rooms) {
      expect(SCREENS[id].region, id).toBe('hrimfjoll');
      expect(SCREENS[id].cold, id).toBeUndefined();
    }
    expect(LAYOUT.dungeons?.d8?.cols).toBe(8);
    expect(LAYOUT.dungeons?.d8?.rows).toBe(5);
  });

  it('is entered through the gate in the ice, and left again the same way', () => {
    const into = SCREENS.hrf_utgard.things.filter((t) => t.k === 'door' && t.to === 'd8_r36');
    expect(into).toHaveLength(2);
    const out = SCREENS.d8_r36.things.filter((t) => t.k === 'door' && t.to === 'hrf_utgard');
    expect(out).toHaveLength(2);
  });

  it('opens each doorway on both sides of the wall it crosses', () => {
    const at = LAYOUT.dungeons?.d8?.at ?? {};
    const by = new Map(
      Object.entries(at).map(([id, [x, y]]) => [`${String(x)},${String(y)}`, id as ScreenId]),
    );
    for (const [id, [x, y]] of Object.entries(at) as [ScreenId, readonly [number, number]][]) {
      const east = by.get(`${String(x + 1)},${String(y)}`);
      if (east !== undefined)
        for (let r = 0; r < 22; r++)
          expect(open(id, 39, r), `${id}→${east} row ${String(r)}`).toBe(open(east, 0, r));
      const south = by.get(`${String(x)},${String(y + 1)}`);
      if (south !== undefined)
        for (let c = 0; c < 40; c++)
          expect(open(id, c, 21), `${id}↓${south} col ${String(c)}`).toBe(open(south, c, 0));
    }
  });

  it('never lets glaze touch a room’s edge', () => {
    for (const id of rooms) {
      const g = grid(id);
      for (let y = 0; y < g.rows; y++)
        for (let x = 0; x < g.cols; x++) {
          const edge = x < 2 || y < 2 || x >= g.cols - 2 || y >= g.rows - 2;
          if (edge) expect(g.cells[y * g.cols + x], `${id} ${String(x)},${String(y)}`).not.toBe('glaze');
        }
    }
  });

  it('sets one seal at the end of each wing, and shows all three in the seal hall', () => {
    const setters = rooms.flatMap((id) =>
      SCREENS[id].things.flatMap((t) =>
        (t.k === 'switch' && t.set?.startsWith('st_d8_seal_') === true) ||
        (t.k === 'eye' && t.flag.startsWith('st_d8_seal_'))
          ? [{ id, flag: t.k === 'switch' ? t.set : t.flag }]
          : [],
      ),
    );
    expect(setters).toEqual(
      expect.arrayContaining([
        { id: 'd8_r09', flag: 'st_d8_seal_w' },
        { id: 'd8_r16', flag: 'st_d8_seal_e' },
        { id: 'd8_r01', flag: 'st_d8_seal_n' },
      ]),
    );
    expect(setters).toHaveLength(3);
    expect(SCREENS.d8_r20.things.filter((t) => t.k === 'seal')).toHaveLength(3);
  });

  it('keeps Jötunvörðr with the master key, and Kolbeinn behind the great lock', () => {
    const where = (enemy: string): ScreenId[] =>
      rooms.filter((id) => SCREENS[id].things.some((t) => t.k === 'enemy' && t.id === enemy));
    expect(where('jotunvordr')).toEqual(['d8_r21']);
    expect(where('kolbeinn_boss')).toEqual(['d8_r13']);
    const bigKey = things('chest').filter(
      ({ t }) => t.k === 'chest' && 'item' in t.gives && t.gives.item === 'big_key',
    );
    expect(bigKey.map(({ id }) => id)).toEqual(['d8_r21']);
    expect(SCREENS.d8_r13.things.some((t) => t.k === 'lock' && t.big === true)).toBe(true);
  });

  it('has four small keys for four locks', () => {
    const keys = things('chest').filter(
      ({ t }) => t.k === 'chest' && 'item' in t.gives && t.gives.item === 'small_key',
    );
    expect(keys).toHaveLength(4);
    const locks = new Set(
      things('lock').flatMap(({ t }) => (t.k === 'lock' && t.big !== true ? [t.id] : [])),
    );
    expect(locks.size).toBe(4);
  });
});
