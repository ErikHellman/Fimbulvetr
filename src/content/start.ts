import type { NewGameInit } from '@core/state/gameState';
import { DUNGEONS } from './ids';

/** M0 starts in the test lands with the seax and shield so every move can be tried. M1 replaces this. */
export const NEW_GAME: NewGameInit = {
  screen: 'test_a',
  x: 168,
  y: 190,
  facing: 's',
  weapon: 'seax',
  shield: true,
  dungeons: DUNGEONS,
};
