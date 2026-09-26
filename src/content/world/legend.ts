import type { TerrainId } from '../terrain';

/** One character per terrain in screen text maps. */
export const LEGEND: Readonly<Record<string, TerrainId>> = {
  '.': 'grass',
  ',': 'path',
  '~': 'water',
  '#': 'rock',
  T: 'tree',
  _: 'ledge',
};
