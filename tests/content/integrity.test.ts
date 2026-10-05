import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { SPAWN_TABLES } from '@content/spawns';
import { NEW_GAME } from '@content/start';
import { TERRAIN } from '@content/terrain';
import { WORLD_LAYOUT } from '@content/world/layout';
import { LEGEND } from '@content/world/legend';
import { SCREENS } from '@content/world/registry';
import { SCREEN_IDS, type ScreenId } from '@content/world/screens';
import { SEASONS, type Season } from '@core/clock/types';
import { coverPassage } from '@core/progress/solver';
import { SCREEN_COLS, SCREEN_ROWS, TILE } from '@core/world/dims';
import { decorPlacements } from '@core/world/decor';
import { indexLayout, neighbourOf } from '@core/world/screen';
import { cellAt, parseTextMap, type TerrainGrid } from '@core/world/textmap';

function walkable(id: ScreenId, season?: Season): (x: number, y: number) => boolean {
  const grid = parseTextMap(SCREENS[id].map, LEGEND);
  const cover = season === undefined ? new Map<number, boolean>() : coverPassage(DB, id, season);
  return (x, y) => {
    const over = cover.get(y * SCREEN_COLS + x);
    if (over !== undefined) return over;
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

  it.each(SCREEN_IDS)('%s places things that stand somewhere on walkable tiles (swimmers in water)', (id) => {
    const ok = walkable(id);
    const grid = parseTextMap(SCREENS[id].map, LEGEND);
    const standing = new Set(['enemy', 'prop', 'critter', 'piece', 'door']);
    for (const thing of SCREENS[id].things) {
      if (!standing.has(thing.k)) continue;
      const where = `${id} ${thing.k} at ${thing.at.x},${thing.at.y}`;
      // A sunk piece lies on the bottom of deep water, for a diver.
      if (thing.k === 'piece' && thing.sunk === true) {
        const t = cellAt(grid, thing.at.x, thing.at.y);
        expect(t !== undefined && DB.terrain[t].swim === true, where).toBe(true);
        continue;
      }
      // Swimmers wait in water, or on the floors they walk as well (the drowned); a dive door lies under it.
      if (
        (thing.k === 'enemy' && DB.enemies[thing.id].swims === true) ||
        (thing.k === 'door' && thing.dive === true)
      ) {
        const t = cellAt(grid, thing.at.x, thing.at.y);
        const water = t !== undefined && TERRAIN[t].solid && 'low' in TERRAIN[t];
        expect(water || (thing.k === 'enemy' && ok(thing.at.x, thing.at.y)), where).toBe(true);
        continue;
      }
      expect(ok(thing.at.x, thing.at.y), where).toBe(true);
    }
  });

  it.each(SCREEN_IDS)('%s puts spawn points on walkable ground outdoors, in a region with a table', (id) => {
    const def = SCREENS[id];
    if (def.spawns === undefined) return;
    expect(def.indoor, `${id} is indoors`).not.toBe(true);
    expect(def.dungeon, `${id} is in a dungeon`).toBeUndefined();
    expect(SPAWN_TABLES[def.region], `${id}: no table for ${def.region}`).toBeDefined();
    const ok = walkable(id);
    for (const p of def.spawns) expect(ok(p.x, p.y), `${id} spawn point ${p.x},${p.y}`).toBe(true);
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

const WATERSIDE = new Set(['water', 'ford', 'jetty', 'spring', 'rapids', 'shoal']);

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

  // In every season too: ice on one side of a seam and open water on the other would drop Ask in the water.
  it.each([undefined, ...SEASONS])(
    'has identical walkable seams between neighbours (season: %s)',
    (season) => {
      const index = indexLayout(WORLD_LAYOUT, SCREEN_IDS);
      for (const id of SCREEN_IDS) {
        const here = walkable(id, season);
        const east = neighbourOf(index, id, 'e');
        if (east !== null) {
          const there = walkable(east, season);
          for (let y = 0; y < SCREEN_ROWS; y++) {
            expect(here(SCREEN_COLS - 1, y), `${id} → ${east}, row ${y}`).toBe(there(0, y));
          }
        }
        const south = neighbourOf(index, id, 's');
        if (south !== null) {
          const there = walkable(south, season);
          for (let x = 0; x < SCREEN_COLS; x++) {
            expect(here(x, SCREEN_ROWS - 1), `${id} → ${south}, col ${x}`).toBe(there(x, 0));
          }
        }
      }
    },
  );

  // With the seal-skin: a swimmer crossing a seam must come out in water or on ground, never in a wall.
  it('lets a swimmer out of every seam it can swim into', () => {
    const index = indexLayout(WORLD_LAYOUT, SCREEN_IDS);
    const open = (id: ScreenId): ((x: number, y: number) => boolean) => {
      const grid = parseTextMap(SCREENS[id].map, LEGEND);
      return (x, y) => {
        const t = cellAt(grid, x, y);
        return t !== undefined && (!TERRAIN[t].solid || DB.terrain[t].swim === true);
      };
    };
    const swim = (id: ScreenId): ((x: number, y: number) => boolean) => {
      const grid = parseTextMap(SCREENS[id].map, LEGEND);
      return (x, y) => {
        const t = cellAt(grid, x, y);
        return t !== undefined && DB.terrain[t].swim === true;
      };
    };
    for (const id of SCREEN_IDS) {
      for (const [dir, other] of [
        ['e', neighbourOf(index, id, 'e')],
        ['s', neighbourOf(index, id, 's')],
      ] as const) {
        if (other === null) continue;
        const n = dir === 'e' ? SCREEN_ROWS : SCREEN_COLS;
        for (let k = 0; k < n; k++) {
          const [hx, hy, tx, ty] = dir === 'e' ? [SCREEN_COLS - 1, k, 0, k] : [k, SCREEN_ROWS - 1, k, 0];
          if (swim(id)(hx, hy)) expect(open(other)(tx, ty), `${id} → ${other} at ${String(k)}`).toBe(true);
          if (swim(other)(tx, ty)) expect(open(id)(hx, hy), `${other} → ${id} at ${String(k)}`).toBe(true);
        }
      }
    }
  });
});

describe('the sleeping dead', () => {
  it('lie only where grave-gold or a script can wake them', () => {
    const wakers = new Set(
      Object.entries(DB.scripts).flatMap(([sid, def]) =>
        JSON.stringify(def).includes('"k":"wake"') ? [sid] : [],
      ),
    );
    for (const id of SCREEN_IDS) {
      const things = SCREENS[id].things;
      if (!things.some((t) => t.k === 'enemy' && t.asleep === true)) continue;
      expect(
        things.some(
          (t) =>
            (t.k === 'prop' && DB.props[t.id].wakes === true) ||
            ((t.k === 'use' || t.k === 'trigger') && wakers.has(t.script)),
        ),
        `${id} has sleepers but nothing to wake them`,
      ).toBe(true);
    }
  });
});

describe('warp stones', () => {
  const stones = SCREEN_IDS.flatMap((id) =>
    SCREENS[id].things.flatMap((t) => (t.k === 'warp' ? [{ id, t }] : [])),
  );

  it('stand one to a region, on the overworld of their own region, with walkable arrivals', () => {
    const seen = new Set<string>();
    for (const { id, t } of stones) {
      expect(seen.has(t.region), `${t.region} has two warp stones`).toBe(false);
      seen.add(t.region);
      expect(SCREENS[id].region, id).toBe(t.region);
      expect(WORLD_LAYOUT.at[id], `${id} is not on the overworld`).toBeDefined();
      expect(walkable(id)(t.arrive.x, t.arrive.y), `${id} arrival`).toBe(true);
      expect(walkable(id)(t.at.x, t.at.y), `${id} stone on walkable ground`).toBe(true);
    }
    expect([...seen].sort()).toEqual(['askdalr', 'haugar', 'myrkvidr', 'myrland', 'niflmyrr', 'saevatn']);
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

  it('reaches every screen off the world grid, and every dungeon grid, through a door', () => {
    const grids = Object.entries(WORLD_LAYOUT.dungeons ?? {});
    const inDungeon = new Set(grids.flatMap(([, g]) => Object.keys(g.at)));
    const offGrid = SCREEN_IDS.filter((id) => WORLD_LAYOUT.at[id] === undefined && !inDungeon.has(id));
    for (const id of offGrid)
      expect(
        doors.some((d) => d.door.to === id),
        id,
      ).toBe(true);
    for (const [dungeon, g] of grids) {
      const rooms = new Set(Object.keys(g.at));
      expect(
        doors.some((d) => rooms.has(d.door.to) && !rooms.has(d.from)),
        `${dungeon} has a way in`,
      ).toBe(true);
    }
  });

  it('marks exactly the rooms on a dungeon grid as that dungeon', () => {
    for (const id of SCREEN_IDS) {
      const grid = Object.entries(WORLD_LAYOUT.dungeons ?? {}).find(([, g]) => g.at[id] !== undefined)?.[0];
      expect(SCREENS[id].dungeon, id).toBe(grid);
    }
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
