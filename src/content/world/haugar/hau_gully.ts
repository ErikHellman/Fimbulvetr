import type { ScreenDef } from '@core/world/screen';

export const hauGully: ScreenDef = {
  id: 'hau_gully',
  region: 'haugar',
  purpose:
    "The way into Haugar: the birch glade's east path runs into a ravine that last autumn's storm filled with fallen rock. Only a bomb clears it. Past the rockfall the ground climbs north onto the heather.",
  things: [
    /** The rockfall: the bomb gate into Haugar. */
    { k: 'crack', id: 'hau_k_gully', at: { x: 6, y: 16 }, w: 1, h: 3, art: 'rock' },
    /** Past the rockfall: Ask has reached Haugar. */
    {
      k: 'trigger',
      at: { x: 8, y: 15 },
      w: 3,
      h: 5,
      script: 'hau_arrive',
      when: { k: 'not', c: { k: 'flag', id: 'st_haugar_reached' } },
    },
  ],
  /** Where Haugar's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 24, y: 10 },
    { x: 12, y: 7 },
  ],
  map: [
    '##################,,,,##################',
    '##################,,,,##################',
    '##################,,,,##################',
    '########EEEEEEEEEE,,,,EEEEEEEE##########',
    '########EEEEEEEEEE,,,,EEEEEKEE##########',
    '########EEEiEEEEEE,,,,EEEEEEEE##########',
    '########EEEEEEEEEE,,,,EEEEEEEE##########',
    '########EEEEEEEEEE,,,,EEEEiEEEE#########',
    '########EEKEEEEEEE,,,,EEEEEEEEE#########',
    '########EEEEEEEEEE,,,,EEEEEEEEE#########',
    '########EEEEEEEEEE,,,,EEEEEEEEEE########',
    '########EEEEiEEEEE,,,,EEEEEEEEE#########',
    '########EEEEEEEEEE,,,,EEEEEEEEE#########',
    '########EEEEEEEEEE,,,,EEEKEEEEE#########',
    '########EEEEEEEEEE,,,,EEEEEEEE##########',
    '########EEEEEEEEEE,,,,EEEEEEEE##########',
    ',,,,,,,,,,,,,,,,,,,,,,EEEEEEEE##########',
    ',,,,,,,,,,,,,,,,,,,,,,EEEEEEEE##########',
    ',,,,,,,,,,,,,,,,,,,,,,EEEEEEEE##########',
    '########################################',
    '########################################',
    '########################################',
  ],
};
