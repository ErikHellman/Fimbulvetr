import { SCREEN_COLS, SCREEN_ROWS } from '@core/world/dims';

/** Útgarðr's map characters (see `world/legend.ts`). */
export const UT = {
  floor: '□',
  wall: '▣',
  glaze: '◇',
  clear: '▧',
  pit: '0',
  lava: '≈',
  water: '~',
} as const;

export type Side = 'n' | 's' | 'e' | 'w';

/**
 * A room of Útgarðr under construction (M10a): a 40×22 hall of giant stone with walls two tiles thick and
 * a two-tile doorway in the middle of each side it opens on (columns 19–20, rows 10–11, as in every
 * dungeon). Each method draws one part and returns the room, so a room reads as a chain ending in `done`.
 */
export class RoomMap {
  private readonly g: string[][];

  constructor(exits: string) {
    this.g = Array.from({ length: SCREEN_ROWS }, (_, y) =>
      Array.from({ length: SCREEN_COLS }, (_, x) =>
        x >= 2 && y >= 2 && x < SCREEN_COLS - 2 && y < SCREEN_ROWS - 2 ? UT.floor : UT.wall,
      ),
    );
    const mx = SCREEN_COLS / 2 - 1;
    const my = SCREEN_ROWS / 2 - 1;
    for (const side of exits) {
      if (side === 'n') this.fill(mx, 0, 2, 2, UT.floor);
      else if (side === 's') this.fill(mx, SCREEN_ROWS - 2, 2, 2, UT.floor);
      else if (side === 'w') this.fill(0, my, 2, 2, UT.floor);
      else if (side === 'e') this.fill(SCREEN_COLS - 2, my, 2, 2, UT.floor);
      else throw new Error(`no side '${side}'`);
    }
  }

  /** Any map character over a box of tiles. */
  fill(x: number, y: number, w: number, h: number, ch: string): this {
    if (x < 0 || y < 0 || x + w > SCREEN_COLS || y + h > SCREEN_ROWS)
      throw new Error(`${String(w)}×${String(h)} at ${String(x)},${String(y)} lies outside the room`);
    for (let yy = y; yy < y + h; yy++) {
      const row = this.g[yy];
      if (row !== undefined) for (let xx = x; xx < x + w; xx++) row[xx] = ch;
    }
    return this;
  }

  wall(x: number, y: number, w: number, h: number): this {
    return this.fill(x, y, w, h, UT.wall);
  }

  floor(x: number, y: number, w: number, h: number): this {
    return this.fill(x, y, w, h, UT.floor);
  }

  /** Square pillars, 2×2 tiles, each from its top-left tile. */
  pillars(...at: readonly { readonly x: number; readonly y: number }[]): this {
    for (const p of at) this.wall(p.x, p.y, 2, 2);
    return this;
  }

  /** A field of glaze. Keep it two tiles off the room's edge (a slide never crosses a screen edge). */
  rink(x: number, y: number, w: number, h: number): this {
    return this.fill(x, y, w, h, UT.glaze);
  }

  pits(x: number, y: number, w: number, h: number): this {
    return this.fill(x, y, w, h, UT.pit);
  }

  lava(x: number, y: number, w: number, h: number): this {
    return this.fill(x, y, w, h, UT.lava);
  }

  water(x: number, y: number, w: number, h: number): this {
    return this.fill(x, y, w, h, UT.water);
  }

  /**
   * A cell: a ring of wall round the box (`x`, `y`, `w`, `h` is its outside), floor within, and a two-tile
   * doorway in the middle of its `door` side (bars or a lock go on it).
   */
  cell(x: number, y: number, w: number, h: number, door: Side): this {
    this.wall(x, y, w, h).floor(x + 1, y + 1, w - 2, h - 2);
    const mx = x + Math.floor(w / 2) - 1;
    const my = y + Math.floor(h / 2) - 1;
    if (door === 'n') this.floor(mx, y, 2, 1);
    else if (door === 's') this.floor(mx, y + h - 1, 2, 1);
    else if (door === 'w') this.floor(x, my, 1, 2);
    else this.floor(x + w - 1, my, 1, 2);
    return this;
  }

  /** A crystal eye's niche on (`x`, `y`): walled on three sides, clear ice on its `face`, so only light reaches it. */
  niche(x: number, y: number, face: Side): this {
    this.wall(x - 1, y - 1, 3, 3).floor(x, y, 1, 1);
    const [dx, dy] = ({ n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] } as const)[face];
    return this.fill(x + dx, y + dy, 1, 1, UT.clear);
  }

  /** The finished map, as a `ScreenDef.map` takes it. */
  done(): readonly string[] {
    return this.g.map((row) => row.join(''));
  }
}

/** A new room of Útgarðr, open on the `exits` sides (any of `nsew`). */
export function room(exits: string): RoomMap {
  return new RoomMap(exits);
}
