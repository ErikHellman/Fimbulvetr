export interface PackInput {
  readonly name: string;
  readonly w: number;
  readonly h: number;
}

export interface Placement {
  readonly page: number;
  readonly x: number;
  readonly y: number;
}

export interface PackResult {
  readonly pageW: number;
  /** Used height of each page (pages are only as tall as they need to be). */
  readonly heights: readonly number[];
  readonly placements: ReadonlyMap<string, Placement>;
}

/** Shelf packing, tallest first. Deterministic for the same input. */
export function packShelves(items: readonly PackInput[], pageSize = 2048, pad = 1): PackResult {
  const sorted = [...items].sort((a, b) => b.h - a.h || a.name.localeCompare(b.name));
  const placements = new Map<string, Placement>();
  const heights: number[] = [0];
  let page = 0;
  let x = 0;
  let shelfY = 0;
  let shelfH = 0;
  for (const it of sorted) {
    if (it.w + pad > pageSize || it.h + pad > pageSize) {
      throw new Error(`frame '${it.name}' (${it.w}×${it.h}) does not fit a ${pageSize}px page`);
    }
    if (x + it.w + pad > pageSize) {
      shelfY += shelfH;
      x = 0;
      shelfH = 0;
    }
    if (shelfY + it.h + pad > pageSize) {
      page += 1;
      heights.push(0);
      x = 0;
      shelfY = 0;
      shelfH = 0;
    }
    placements.set(it.name, { page, x, y: shelfY });
    x += it.w + pad;
    shelfH = Math.max(shelfH, it.h + pad);
    heights[page] = Math.max(heights[page] ?? 0, shelfY + shelfH);
  }
  return { pageW: pageSize, heights, placements };
}
