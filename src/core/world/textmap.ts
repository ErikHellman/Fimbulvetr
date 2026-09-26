import type { TerrainId } from '@content/terrain';
import { SCREEN_COLS, SCREEN_ROWS } from './dims';

export class MapError extends Error {}

export interface TerrainGrid {
  readonly cols: number;
  readonly rows: number;
  readonly cells: readonly TerrainId[];
}

export function parseTextMap(
  lines: readonly string[],
  legend: Readonly<Record<string, TerrainId>>,
  cols: number = SCREEN_COLS,
  rows: number = SCREEN_ROWS,
): TerrainGrid {
  if (lines.length !== rows) throw new MapError(`expected ${rows} rows, got ${lines.length}`);
  const cells: TerrainId[] = [];
  lines.forEach((line, r) => {
    if (line.length !== cols)
      throw new MapError(`row ${r + 1}: expected ${cols} columns, got ${line.length}`);
    for (let c = 0; c < cols; c++) {
      const ch = line.charAt(c);
      const terrain = legend[ch];
      if (terrain === undefined)
        throw new MapError(`row ${r + 1}, col ${c + 1}: unknown map character '${ch}'`);
      cells.push(terrain);
    }
  });
  return { cols, rows, cells };
}

export function cellAt(g: TerrainGrid, x: number, y: number): TerrainId | undefined {
  if (x < 0 || y < 0 || x >= g.cols || y >= g.rows) return undefined;
  return g.cells[y * g.cols + x];
}
