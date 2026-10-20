import type { TileSheet } from '../askdalr/build';
import { CURRENT_E, CURRENT_N, CURRENT_S, CURRENT_W, SURGE_E, SURGE_N, SURGE_S, SURGE_W } from './tiles';

/** Sævatn's drawn tile sheets: the currents a swimmer rides and the surges only a diver crosses. */
export function saevatnSheets(): TileSheet[] {
  return [
    { terrain: 'current_n', cells: CURRENT_N },
    { terrain: 'current_e', cells: CURRENT_E },
    { terrain: 'current_s', cells: CURRENT_S },
    { terrain: 'current_w', cells: CURRENT_W },
    { terrain: 'surge_n', cells: SURGE_N },
    { terrain: 'surge_e', cells: SURGE_E },
    { terrain: 'surge_s', cells: SURGE_S },
    { terrain: 'surge_w', cells: SURGE_W },
  ];
}
