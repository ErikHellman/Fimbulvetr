import type { TileSheet } from '../askdalr/build';
import { BELT_E, BELT_N, BELT_S, BELT_W, FORGE_FLOOR, FORGE_WALL, LAVA } from './tiles';

/** Ívaldi's Forge: its drawn tile sheets. */
export function forgeSheets(): TileSheet[] {
  return [
    { terrain: 'forge_floor', cells: FORGE_FLOOR },
    { terrain: 'forge_wall', cells: FORGE_WALL },
    { terrain: 'lava', cells: LAVA },
    { terrain: 'belt_n', cells: BELT_N },
    { terrain: 'belt_e', cells: BELT_E },
    { terrain: 'belt_s', cells: BELT_S },
    { terrain: 'belt_w', cells: BELT_W },
  ];
}
