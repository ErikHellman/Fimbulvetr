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

/** Where a new game begins. */
export const NEW_GAME: NewGameInit = TEST_START;
