import type { GridPalette } from '@art/grid';
import { FIX_PAL } from '../fixtures/palette';

/** Letters used in the icon, HUD and effect grids: the fixture letters plus a deep blue. */
export const UI_PAL: GridPalette = {
  ...FIX_PAL,
  '0': '#3a5a8a',
};
