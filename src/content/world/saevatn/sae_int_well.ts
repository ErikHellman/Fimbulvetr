import type { ScreenDef } from '@core/world/screen';

export const saeIntWell: ScreenDef = {
  id: 'sae_int_well',
  region: 'saevatn',
  purpose:
    "Urðr's well, a dry cave under Sævatn's whirlpool: the three Norns sit at their loom (17–22, 4) with three empty warps, and the well itself stands east. Ask comes up out of the pool in the south; a dive at (20, 18) goes back up to the north water.",
  indoor: true,
  things: [
    {
      k: 'door',
      at: { x: 20, y: 18 },
      dir: 's',
      to: 'sae_well',
      // Up through the whirlpool and carried to the west shore: there is nowhere to stand in the north water.
      arrive: { x: 8, y: 7 },
      facing: 'e',
      dive: true,
    },
    {
      k: 'sign',
      at: { x: 30, y: 10 },
      w: 2,
      h: 2,
      text: {
        en: 'Urðr’s well. The water in it is white as the skin of an egg, and it does not move.',
        sv: 'Urds brunn. Vattnet i den är vitt som hinnan i ett ägg, och det rör sig inte.',
      },
    },
  ],
  map: [
    'QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
    'QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'QQcccccccccccccccttttttcccccccccccccccQQ',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'QQccccccccccccccccccccccccccccOOccccccQQ',
    'QQccccccccccccccccccccccccccccOOccccccQQ',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'QQccccccccccccccccccccccccccccccccccccQQ',
    'QQcccccccccccc~~~~~~~~~~~~ccccccccccccQQ',
    'QQcccccccccccc~~~~~~~~~~~~ccccccccccccQQ',
    'QQcccccccccccc~~~~~~~~~~~~ccccccccccccQQ',
    'QQcccccccccccc~~~~~~~~~~~~ccccccccccccQQ',
    'QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
    'QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ',
  ],
};
