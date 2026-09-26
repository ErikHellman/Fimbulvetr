import { describe, expect, it } from 'vitest';
import { TERRAIN, type TerrainId } from '@content/terrain';
import type { Box } from '@core/math/box';
import {
  buildCollision,
  gridSolidAt,
  ledgeHop,
  moveBox,
  speedAt,
  type CollisionGrid,
  type SolidAt,
} from '@core/world/collision';

/** '#' is solid; anything outside the strings is solid too. */
function solidFrom(rows: string[]): SolidAt {
  return (tx, ty) => {
    const row = rows[ty];
    if (row === undefined || tx < 0 || tx >= row.length) return true;
    return row.charAt(tx) === '#';
  };
}

function repeat(box: Box, dx: number, dy: number, solidAt: SolidAt, times: number): Box {
  let b = box;
  for (let i = 0; i < times; i++) {
    const r = moveBox(b, dx, dy, solidAt);
    b = { ...b, x: r.x, y: r.y };
  }
  return b;
}

describe('moveBox', () => {
  it('moves freely in open space, including sub-pixel steps', () => {
    const r = moveBox({ x: 20, y: 20, w: 12, h: 8 }, 1.5, -0.5, solidFrom(['.....', '.....', '.....']));
    expect([r.x, r.y, r.blockedX, r.blockedY]).toEqual([21.5, 19.5, false, false]);
  });

  it('stops flush against a wall', () => {
    const r = moveBox({ x: 10, y: 4, w: 12, h: 8 }, 20, 0, solidFrom(['..#', '..#']));
    expect(r.x).toBe(20);
    expect(r.blockedX).toBe(true);
  });

  it('never tunnels through a wall, however fast', () => {
    const r = moveBox({ x: 0, y: 2, w: 12, h: 8 }, 40, 0, solidFrom(['.#.']));
    expect(r.x).toBe(4);
  });

  it('slides around a corner it clips by up to 6 px (Zelda-style)', () => {
    const solid = solidFrom(['.#', '..']);
    const end = repeat({ x: 2, y: 12, w: 12, h: 8 }, 1.5, 0, solid, 12);
    expect(end.y).toBeGreaterThanOrEqual(16);
    expect(end.x).toBeGreaterThan(5);
  });

  it('does not slide when the overlap is larger than 6 px', () => {
    const solid = solidFrom(['.#', '..']);
    const end = repeat({ x: 2, y: 4, w: 12, h: 8 }, 1.5, 0, solid, 12);
    expect(end.y).toBe(4);
    expect(end.x).toBe(4);
  });

  it('does not slide while moving diagonally', () => {
    const r = moveBox({ x: 4, y: 12, w: 12, h: 8 }, 1, 0.5, solidFrom(['.#', '..', '..']));
    expect(r.blockedX).toBe(true);
    expect(r.x).toBe(4);
    expect(r.y).toBe(12.5);
  });

  it('treats a non-finite delta as zero instead of looping forever', () => {
    const r = moveBox({ x: 20, y: 20, w: 12, h: 8 }, NaN, NaN, solidFrom(['.....', '.....', '.....']));
    expect([r.x, r.y, r.blockedX, r.blockedY]).toEqual([20, 20, false, false]);
  });

  it('treats obstacle boxes like walls', () => {
    const r = moveBox({ x: 0, y: 0, w: 10, h: 10 }, 10, 0, solidFrom(['...']), [
      { x: 15, y: 0, w: 5, h: 10 },
    ]);
    expect(r.x).toBe(5);
  });
});

describe('collision grid', () => {
  it('marks solid terrain and asks `outside` beyond the edges', () => {
    const grid = buildCollision({ cols: 2, rows: 1, cells: ['grass', 'rock'] }, TERRAIN);
    const solidAt = gridSolidAt(grid, (tx) => tx >= 2);
    expect([solidAt(0, 0), solidAt(1, 0), solidAt(-1, 0), solidAt(2, 0)]).toEqual([false, true, false, true]);
  });
});

describe('ledges and slow ground', () => {
  const defs = {
    ...TERRAIN,
    grass: { solid: false },
    path: { solid: false, slow: 0.5 },
    rock: { solid: false, ledge: 's' as const },
  };
  /** '.' grass, ',' slow path, '#' a south ledge. */
  function grid(rows: string[]): CollisionGrid {
    const cells = rows.flatMap((r) =>
      Array.from(r, (ch) => (ch === '#' ? 'rock' : ch === ',' ? 'path' : 'grass') as TerrainId),
    );
    return buildCollision({ cols: rows[0]?.length ?? 0, rows: rows.length, cells }, defs);
  }
  const g = grid(['....', '####', '....', ',,,,']);
  const walls = gridSolidAt(g, () => true);

  it('is solid from every side', () => {
    expect(walls(1, 1)).toBe(true);
  });

  it('hops a box flush above a south ledge clear past it', () => {
    const b = { x: 18, y: 8, w: 12, h: 8 };
    expect(ledgeHop(g, b, 's', walls)).toEqual({ dx: 0, dy: 24 });
  });

  it('does not hop in any other direction or when not flush', () => {
    expect(ledgeHop(g, { x: 18, y: 32, w: 12, h: 8 }, 'n', walls)).toBeNull();
    expect(ledgeHop(g, { x: 18, y: 7, w: 12, h: 8 }, 's', walls)).toBeNull();
  });

  it('does not hop onto a blocked landing', () => {
    const blocked = { x: 16, y: 32, w: 16, h: 16 };
    expect(ledgeHop(g, { x: 18, y: 8, w: 12, h: 8 }, 's', walls, [blocked])).toBeNull();
  });

  it('reports the speed factor under a point', () => {
    expect(speedAt(g, 5, 5)).toBe(1);
    expect(speedAt(g, 5, 53)).toBe(0.5);
    expect(speedAt(g, -5, 5)).toBe(1);
  });
});
