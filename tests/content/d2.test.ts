import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { WORLD_LAYOUT } from '@content/world/layout';
import { SCREENS } from '@content/world/registry';
import { SCREEN_IDS, type ScreenId } from '@content/world/screens';
import { LINDORMR } from '@core/actors/enemies/lindormr';
import { SCREEN_COLS, SCREEN_ROWS, TILE } from '@core/world/dims';
import { indexLayout, neighbourOf, tileFeet } from '@core/world/screen';
import { cellAt, parseTextMap } from '@core/world/textmap';
import { riseFooting } from '@core/world/water';

const LEVELS = [0, 1, 2] as const;
const watery = SCREEN_IDS.filter((id) => SCREENS[id].water !== undefined);

/** Whether tile (x, y) of a screen gives footing at a water level. */
function footing(id: ScreenId, level: number): (x: number, y: number) => boolean {
  const grid = parseTextMap(SCREENS[id].map, DB.legend);
  return (x, y) => {
    const t = cellAt(grid, x, y);
    if (t === undefined) return false;
    const rise = DB.terrain[t].rise;
    return rise === undefined ? !DB.terrain[t].solid : riseFooting(rise, level);
  };
}

/** Whether tile (x, y) rises with the water. */
function rises(id: ScreenId): (x: number, y: number) => boolean {
  const grid = parseTextMap(SCREENS[id].map, DB.legend);
  return (x, y) => {
    const t = cellAt(grid, x, y);
    return t !== undefined && DB.terrain[t].rise !== undefined;
  };
}

describe('Sökkva Kvern', () => {
  it('has water in every room, and only there', () => {
    const rooms = SCREEN_IDS.filter((id) => SCREENS[id].dungeon === 'd2');
    expect(rooms).toHaveLength(16);
    expect(watery.sort()).toEqual(rooms.sort());
  });

  it.each(LEVELS)('has identical footing across every seam at level %i', (level) => {
    const index = indexLayout(WORLD_LAYOUT, SCREEN_IDS);
    for (const id of watery) {
      const here = footing(id, level);
      const east = neighbourOf(index, id, 'e');
      if (east !== null) {
        const there = footing(east, level);
        for (let y = 0; y < SCREEN_ROWS; y++)
          expect(here(SCREEN_COLS - 1, y), `${id} → ${east}, row ${y}`).toBe(there(0, y));
      }
      const south = neighbourOf(index, id, 's');
      if (south !== null) {
        const there = footing(south, level);
        for (let x = 0; x < SCREEN_COLS; x++)
          expect(here(x, SCREEN_ROWS - 1), `${id} → ${south}, col ${x}`).toBe(there(x, 0));
      }
    }
  });

  it('never lets a wheel change the ground beside it, nor a door drop Ask where the water rises', () => {
    for (const id of SCREEN_IDS) {
      const r = rises(id);
      for (const t of SCREENS[id].things) {
        if (t.k === 'wheel')
          for (const [dx, dy] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ] as const)
            expect(r(t.at.x + dx, t.at.y + dy), `${id} wheel at ${t.at.x},${t.at.y}`).toBe(false);
        if (t.k === 'door') expect(rises(t.to)(t.arrive.x, t.arrive.y), `${id} → ${t.to}`).toBe(false);
      }
    }
  });

  it('keeps a bomb pot in, or next door to, every room that needs bombs', () => {
    const index = indexLayout(WORLD_LAYOUT, SCREEN_IDS);
    const pots = (id: ScreenId): boolean =>
      SCREENS[id].things.some((t) => t.k === 'prop' && t.id === 'bomb_pot');
    for (const id of SCREEN_IDS) {
      if (SCREENS[id].dungeon !== 'd2') continue;
      const needs = SCREENS[id].things.some(
        (t) => t.k === 'crack' || (t.k === 'enemy' && (DB.enemies[t.id].needs ?? []).includes('bombs')),
      );
      if (!needs) continue;
      const near = (['n', 's', 'e', 'w'] as const).map((d) => neighbourOf(index, id, d));
      expect(pots(id) || near.some((n) => n !== null && pots(n)), id).toBe(true);
    }
  });

  it('raises Lindormr’s mounds on open silt', () => {
    const boss = SCREENS.d2_r15.things.find((t) => t.k === 'enemy' && t.id === 'lindormr');
    if (boss === undefined) throw new Error('no Lindormr');
    const at = tileFeet(boss.at);
    const ok = footing('d2_r15', 0);
    for (const m of LINDORMR.mounds) {
      const x = Math.floor((at.x + m.x) / TILE);
      const y = Math.floor((at.y + m.y - 1) / TILE);
      expect(ok(x, y), `mound at ${x},${y}`).toBe(true);
    }
  });
});
