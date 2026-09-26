import type { NewGameInit } from '@core/state/gameState';
import { DUNGEONS } from './ids';

/** The M0 kit in the test lands: seax and shield, so every move can be tried. Tests start here. */
export const TEST_START: NewGameInit = {
  screen: 'test_a',
  x: 168,
  y: 190,
  facing: 's',
  weapon: 'seax',
  shield: true,
  dungeons: DUNGEONS,
};

/** A new game: day 1 of the prologue, dawn in Halvar's longhouse, beside Ask's bed. */
export const NEW_GAME: NewGameInit = {
  screen: 'ask_int_longhouse',
  x: 11 * 16 + 8,
  y: 8 * 16 + 14,
  facing: 's',
  weapon: 'handaxe',
  shield: false,
  dungeons: DUNGEONS,
  flags: { st_farm_day: 1 },
  minute: 6 * 60,
};
