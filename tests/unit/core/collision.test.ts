import { describe, expect, it } from 'vitest';
import { TERRAIN } from '@content/terrain';
import type { Box } from '@core/math/box';
import { buildCollision, gridSolidAt, moveBox, type SolidAt } from '@core/world/collision';

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
