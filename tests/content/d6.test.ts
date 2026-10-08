import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { WORLD_LAYOUT } from '@content/world/layout';
import { SCREENS } from '@content/world/registry';
import { SCREEN_IDS, type ScreenId } from '@content/world/screens';
import { parseTextMap } from '@core/world/textmap';

const rooms = SCREEN_IDS.filter((id) => SCREENS[id].dungeon === 'd6');

const grid = (id: ScreenId) => parseTextMap(SCREENS[id].map, DB.legend);
const cell = (id: ScreenId, x: number, y: number): string | undefined => {
  const g = grid(id);
  return g.cells[y * g.cols + x];
};

describe('Ívaldi’s Forge', () => {
  it('has twenty-eight rooms in Dvergagröf', () => {
    expect(rooms).toHaveLength(28);
    for (const id of rooms) expect(SCREENS[id].region, id).toBe('dvergagrof');
  });

  it('is entered from the forge gate, and left again the same way', () => {
    const into = SCREENS.dvg_forgegate.things.filter((t) => t.k === 'door' && t.to === 'd6_r25');
    expect(into).toHaveLength(2);
    const out = SCREENS.d6_r25.things.filter((t) => t.k === 'door' && t.to === 'dvg_forgegate');
    expect(out).toHaveLength(2);
  });

  it('turns every belt in it with the one lever', () => {
    for (const id of rooms) {
      const belts = grid(id).cells.some((c) => c.startsWith('belt_'));
      expect(SCREENS[id].belts?.flag, id).toBe(belts ? 'w_d6_belts' : undefined);
    }
    const levers = rooms.flatMap((id) =>
      SCREENS[id].things.flatMap((t) => (t.k === 'switch' && t.set === 'w_d6_belts' ? [id] : [])),
    );
    expect(levers).toEqual(['d6_r17']);
  });

  it('never puts two hot rooms side by side, and keeps the boss hall cool', () => {
    const at = WORLD_LAYOUT.dungeons?.d6?.at ?? {};
    const hot = rooms.filter((id) => SCREENS[id].hot === true);
    expect(hot.length).toBeGreaterThanOrEqual(3);
    for (const a of hot)
      for (const b of hot) {
        const [ax = 0, ay = 0] = at[a] ?? [];
        const [bx = 0, by = 0] = at[b] ?? [];
        const open = a !== b && Math.abs(ax - bx) + Math.abs(ay - by) === 1;
        // Neighbours on the grid are fine when no way joins them.
        const seam =
          ax === bx
            ? cell(ay < by ? a : b, 19, 21) !== 'forge_wall'
            : cell(ax < bx ? a : b, 39, 10) !== 'forge_wall';
        expect(open && seam, `${a} and ${b}`).toBe(false);
      }
    expect(SCREENS.d6_r04.hot).toBeUndefined();
  });

  it('keeps Þorkell and Rannveig in its cells, behind bars, until Ívaldi falls', () => {
    const places = (id: 'thorkell' | 'rannveig') => DB.npcs[id]?.places ?? [];
    expect(places('thorkell').map((p) => p.screen)).toContain('d6_r09');
    expect(places('rannveig').map((p) => p.screen)).toContain('d6_r08');
    const bars = rooms.flatMap((id) =>
      SCREENS[id].things.flatMap((t) => (t.k === 'gate' && t.art === 'bars' && id !== 'd6_r17' ? [id] : [])),
    );
    expect(bars.sort()).toEqual(['d6_r08', 'd6_r09']);
  });

  it('keeps Belgr before the hammer, and Ívaldi behind the great lock', () => {
    const where = (enemy: string): ScreenId[] =>
      rooms.filter((id) => SCREENS[id].things.some((t) => t.k === 'enemy' && t.id === enemy));
    expect(where('belgr')).toEqual(['d6_r16']);
    expect(where('ivaldi')).toEqual(['d6_r04']);
    expect(SCREENS.d6_r04.things.some((t) => t.k === 'lock' && t.big === true)).toBe(true);
  });
});
