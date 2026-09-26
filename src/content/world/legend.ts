import type { TerrainId } from '../terrain';

/** One character per terrain in screen text maps. */
export const LEGEND: Readonly<Record<string, TerrainId>> = {
  '.': 'grass',
  ',': 'path',
  '~': 'water',
  '#': 'rock',
  T: 'tree',
  _: 'ledge',
  '=': 'fence',
  ':': 'field',
  ';': 'yard',
  R: 'roof',
  W: 'wall',
  D: 'door',
  f: 'floor',
  w: 'wall_int',
  X: 'void',
  o: 'ford',
  O: 'well',
  U: 'trough',
  S: 'stump',
  b: 'bed',
  h: 'hearth',
  t: 'table',
  M: 'menhir',
  /** Grass under tall grass cover (see COVER_LEGEND). */
  '"': 'grass',
};
