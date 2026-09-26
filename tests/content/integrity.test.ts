import { describe, expect, it } from 'vitest';
import { NEW_GAME } from '@content/start';
import { TERRAIN } from '@content/terrain';
import { WORLD_LAYOUT } from '@content/world/layout';
import { LEGEND } from '@content/world/legend';
import { SCREENS } from '@content/world/registry';
import { SCREEN_IDS, type ScreenId } from '@content/world/screens';
import { SCREEN_COLS, SCREEN_ROWS, TILE } from '@core/world/dims';
import { indexLayout, neighbourOf } from '@core/world/screen';
import { cellAt, parseTextMap } from '@core/world/textmap';

function walkable(id: ScreenId): (x: number, y: number) => boolean {
  const grid = parseTextMap(SCREENS[id].map, LEGEND);
  return (x, y) => {
    const t = cellAt(grid, x, y);
    return t !== undefined && !TERRAIN[t].solid;
  };
}

describe('screens', () => {
  it.each(SCREEN_IDS)('%s matches its key, has a purpose and a valid map', (id) => {
    const def = SCREENS[id];
    expect(def.id).toBe(id);
    expect(def.purpose.trim()).not.toBe('');
    expect(() => parseTextMap(def.map, LEGEND)).not.toThrow();
  });

  it.each(SCREEN_IDS)('%s places things that stand somewhere on walkable tiles', (id) => {
    const ok = walkable(id);
    const standing = new Set(['enemy', 'prop', 'critter', 'piece', 'door']);
    for (const thing of SCREENS[id].things) {
      if (!standing.has(thing.k)) continue;
      expect(ok(thing.at.x, thing.at.y), `${id} ${thing.k} at ${thing.at.x},${thing.at.y}`).toBe(true);
    }
  });
});

describe('world layout', () => {
  it('places screens inside the grid without overlaps', () => {
    expect(() => indexLayout(WORLD_LAYOUT, SCREEN_IDS)).not.toThrow();
    for (const [id, pos] of Object.entries(WORLD_LAYOUT.at) as Array<
      [ScreenId, readonly [number, number] | undefined]
    >) {
      expect(SCREEN_IDS).toContain(id);
      if (pos === undefined) continue;
      expect(pos[0]).toBeGreaterThanOrEqual(0);
      expect(pos[0]).toBeLessThan(WORLD_LAYOUT.cols);
      expect(pos[1]).toBeGreaterThanOrEqual(0);
      expect(pos[1]).toBeLessThan(WORLD_LAYOUT.rows);
    }
  });

  it('has identical walkable seams between neighbouring screens', () => {
    const index = indexLayout(WORLD_LAYOUT, SCREEN_IDS);
    for (const id of SCREEN_IDS) {
      const here = walkable(id);
      const east = neighbourOf(index, id, 'e');
      if (east !== null) {
        const there = walkable(east);
        for (let y = 0; y < SCREEN_ROWS; y++) {
          expect(here(SCREEN_COLS - 1, y), `${id} → ${east}, row ${y}`).toBe(there(0, y));
        }
      }
      const south = neighbourOf(index, id, 's');
      if (south !== null) {
        const there = walkable(south);
        for (let x = 0; x < SCREEN_COLS; x++) {
          expect(here(x, SCREEN_ROWS - 1), `${id} → ${south}, col ${x}`).toBe(there(x, 0));
        }
      }
    }
  });
});

describe('new game', () => {
  it('starts on a walkable tile', () => {
    const ok = walkable(NEW_GAME.screen);
    expect(ok(Math.floor(NEW_GAME.x / TILE), Math.floor(NEW_GAME.y / TILE))).toBe(true);
  });
});
