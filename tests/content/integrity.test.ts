import { describe, expect, it } from 'vitest';
import { NEW_GAME } from '@content/start';
import { TERRAIN } from '@content/terrain';
import { WORLD_LAYOUT } from '@content/world/layout';
import { LEGEND } from '@content/world/legend';
import { SCREENS } from '@content/world/registry';
import { SCREEN_IDS, type ScreenId } from '@content/world/screens';
import { SCREEN_COLS, SCREEN_ROWS, TILE } from '@core/world/dims';
import { decorPlacements } from '@core/world/decor';
import { indexLayout, neighbourOf } from '@core/world/screen';
import { cellAt, parseTextMap, type TerrainGrid } from '@core/world/textmap';

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

  it.each(SCREEN_IDS)('%s lays fires and gates on walkable tiles only', (id) => {
    const ok = walkable(id);
    for (const thing of SCREENS[id].things) {
      if (thing.k !== 'fire' && thing.k !== 'gate') continue;
      for (let y = 0; y < thing.h; y++)
        for (let x = 0; x < thing.w; x++)
          expect(
            ok(thing.at.x + x, thing.at.y + y),
            `${id} ${thing.k} at ${thing.at.x + x},${thing.at.y + y}`,
          ).toBe(true);
    }
  });
});

const WATERSIDE = new Set(['water', 'ford', 'jetty']);

describe('buildings', () => {
  const cache = new Map<ScreenId, TerrainGrid>();
  const grid = (id: ScreenId): TerrainGrid => {
    let g = cache.get(id);
    if (g === undefined) {
      g = parseTextMap(SCREENS[id].map, LEGEND);
      cache.set(id, g);
    }
    return g;
  };
  const cells = (id: ScreenId, terrain: string): Array<[number, number]> => {
    const out: Array<[number, number]> = [];
    for (let y = 0; y < SCREEN_ROWS; y++)
      for (let x = 0; x < SCREEN_COLS; x++) if (cellAt(grid(id), x, y) === terrain) out.push([x, y]);
    return out;
  };

  it.each(SCREEN_IDS)('%s has a door Thing on every open doorway', (id) => {
    for (const [x, y] of cells(id, 'door')) {
      const thing = SCREENS[id].things.find((t) => t.k === 'door' && t.at.x === x && t.at.y === y);
      expect(thing, `${id} doorway at ${x},${y}`).toBeDefined();
    }
  });

  it.each(SCREEN_IDS)('%s keeps every chimney inside its roof', (id) => {
    for (const [x, y] of cells(id, 'chimney')) {
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const t = cellAt(grid(id), x + dx, y + dy);
          expect(
            t === 'roof' || t === 'chimney',
            `${id} chimney at ${x},${y}: ${x + dx},${y + dy} is ${String(t)}`,
          ).toBe(true);
        }
    }
  });

  it.each(SCREEN_IDS)('%s puts windows and shut doors in a wall under a roof', (id) => {
    for (const [x, y] of [...cells(id, 'window'), ...cells(id, 'door_shut')]) {
      const above = cellAt(grid(id), x, y - 1);
      expect(above === 'roof' || above === 'chimney', `${id} ${x},${y} has ${String(above)} above`).toBe(
        true,
      );
    }
  });

  it.each(SCREEN_IDS)('%s keeps every jetty tile at the waterside', (id) => {
    for (const [x, y] of cells(id, 'jetty')) {
      const beside = [
        cellAt(grid(id), x, y - 1),
        cellAt(grid(id), x, y + 1),
        cellAt(grid(id), x - 1, y),
        cellAt(grid(id), x + 1, y),
      ];
      expect(
        beside.some((t) => t !== undefined && WATERSIDE.has(t)),
        `${id} jetty at ${x},${y}`,
      ).toBe(true);
    }
  });
});

describe('decor', () => {
  it.each(SCREEN_IDS)('%s draws every object on a complete footprint', (id) => {
    expect(() => decorPlacements(parseTextMap(SCREENS[id].map, LEGEND), TERRAIN)).not.toThrow();
  });
});

describe('interact zones', () => {
  it.each(SCREEN_IDS)('%s keeps every sign and use rectangle inside the map', (id) => {
    for (const thing of SCREENS[id].things) {
      if (thing.k !== 'sign' && thing.k !== 'use') continue;
      const w = thing.w ?? 1;
      const h = thing.h ?? 1;
      expect(w, `${id} ${thing.k} at ${thing.at.x},${thing.at.y}`).toBeGreaterThan(0);
      expect(h).toBeGreaterThan(0);
      expect(thing.at.x + w).toBeLessThanOrEqual(SCREEN_COLS);
      expect(thing.at.y + h).toBeLessThanOrEqual(SCREEN_ROWS);
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

describe('doors', () => {
  const doors = SCREEN_IDS.flatMap((id) =>
    SCREENS[id].things.flatMap((t) => (t.k === 'door' ? [{ from: id, door: t }] : [])),
  );

  it.each(doors.map((d) => [`${d.from} → ${d.door.to}`, d] as const))(
    '%s arrives on a walkable tile',
    (_, { door }) => {
      expect(walkable(door.to)(door.arrive.x, door.arrive.y)).toBe(true);
    },
  );

  it.each(doors.map((d) => [`${d.from} → ${d.door.to}`, d] as const))(
    '%s has a door back',
    (_, { from, door }) => {
      expect(SCREENS[door.to].things.some((t) => t.k === 'door' && t.to === from)).toBe(true);
    },
  );

  it('never drops the hero straight onto another door facing its way', () => {
    for (const { door } of doors) {
      const back = SCREENS[door.to].things.find(
        (t) =>
          t.k === 'door' && t.at.x === door.arrive.x && t.at.y === door.arrive.y && t.dir === door.facing,
      );
      expect(back, `${door.to} ${door.arrive.x},${door.arrive.y}`).toBeUndefined();
    }
  });

  it('reaches every screen off the world grid', () => {
    const offGrid = SCREEN_IDS.filter((id) => WORLD_LAYOUT.at[id] === undefined);
    for (const id of offGrid)
      expect(
        doors.some((d) => d.door.to === id),
        id,
      ).toBe(true);
  });
});

describe('heart pieces', () => {
  it('have unique ids', () => {
    const ids = SCREEN_IDS.flatMap((id) =>
      SCREENS[id].things.flatMap((t) => (t.k === 'piece' ? [t.id] : [])),
    );
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('new game', () => {
  it('starts on a walkable tile', () => {
    const ok = walkable(NEW_GAME.screen);
    expect(ok(Math.floor(NEW_GAME.x / TILE), Math.floor(NEW_GAME.y / TILE))).toBe(true);
  });
});
