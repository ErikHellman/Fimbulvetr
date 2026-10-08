import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { SCREENS } from '@content/world/registry';
import { SCREEN_IDS, type ScreenId } from '@content/world/screens';
import { parseTextMap } from '@core/world/textmap';

const rooms = SCREEN_IDS.filter((id) => SCREENS[id].dungeon === 'd4');

const cell = (id: ScreenId, x: number, y: number): string | undefined => {
  const g = parseTextMap(SCREENS[id].map, DB.legend);
  return g.cells[y * g.cols + x];
};

describe('Helgrind', () => {
  it('stands every grapple post on floor, with floor on at least one side to land on', () => {
    let posts = 0;
    for (const id of rooms)
      for (const t of SCREENS[id].things) {
        if (t.k !== 'post') continue;
        posts += 1;
        expect(cell(id, t.at.x, t.at.y), `${id} post ${String(t.at.x)},${String(t.at.y)}`).toBe(
          'crypt_floor',
        );
        const sides = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ].map(([dx = 0, dy = 0]) => cell(id, t.at.x + dx, t.at.y + dy));
        expect(sides, `${id} post ${String(t.at.x)},${String(t.at.y)}`).toContain('crypt_floor');
      }
    expect(posts).toBeGreaterThanOrEqual(12);
  });

  it('floats every raft on the river at each stop, beside a bank to step on from', () => {
    let rafts = 0;
    for (const id of rooms)
      for (const t of SCREENS[id].things) {
        if (t.k !== 'raft') continue;
        rafts += 1;
        for (const stop of [t.at, ...t.path]) {
          for (const [dx, dy] of [
            [0, 0],
            [1, 0],
            [0, 1],
            [1, 1],
          ] as const)
            expect(cell(id, stop.x + dx, stop.y + dy), `${id} raft deck`).toBe('rapids');
          const ring = [
            [-1, 0],
            [-1, 1],
            [2, 0],
            [2, 1],
            [0, -1],
            [1, -1],
            [0, 2],
            [1, 2],
          ].map(([dx = 0, dy = 0]) => cell(id, stop.x + dx, stop.y + dy));
          expect(ring, `${id} raft stop ${String(stop.x)},${String(stop.y)}`).toContain('crypt_floor');
        }
      }
    expect(rafts).toBe(2);
  });

  it('has three fog rooms, and Náströnd fills his own hall with fog', () => {
    expect(rooms.filter((id) => SCREENS[id].fog === true)).toHaveLength(3);
    expect(SCREENS.d4_r21.things.some((t) => t.k === 'enemy' && t.id === 'nastrond')).toBe(true);
  });

  it('keeps Ulf and Tófa in its cells, behind bars, until Náströnd falls', () => {
    const places = (id: 'ulf' | 'tofa') => DB.npcs[id]?.places ?? [];
    expect(places('ulf').map((p) => p.screen)).toContain('d4_r18');
    expect(places('tofa').map((p) => p.screen)).toContain('d4_r19');
    const bars = rooms.flatMap((id) =>
      SCREENS[id].things.flatMap((t) => (t.k === 'gate' && t.art === 'bars' ? [id] : [])),
    );
    expect(bars.sort()).toEqual(['d4_r18', 'd4_r19']);
    const death = SCREENS.d4_r21.things.find((t) => t.k === 'enemy' && t.id === 'nastrond');
    expect(death?.k === 'enemy' ? death.onDeath : []).toEqual(
      expect.arrayContaining([
        { k: 'set', flag: 'st_freed_ulf', value: true },
        { k: 'set', flag: 'st_freed_tofa', value: true },
        { k: 'add', flag: 'q_captives', n: 2 },
        { k: 'add', flag: 'q_thanes', n: 1 },
      ]),
    );
  });
});
