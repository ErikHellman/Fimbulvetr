import type { ScreenDef } from '@core/world/screen';

export const dvgMinehead: ScreenDef = {
  id: 'dvg_minehead',
  region: 'dvergagrof',
  purpose:
    "The mine's mouth under the cliff: the old workings lie behind a cave-in (bombs), where the foreman's crew is trapped, and a second mouth east is the cart road to Uppvík, boarded until the crew is out. The road runs on east to Ívaldi's door and north to the slag heaps.",
  things: [
    /** The cave-in across the mine mouth: a bomb clears it. */
    { k: 'crack', id: 'dvg_k_cavein', at: { x: 20, y: 4 }, w: 1, h: 1, art: 'rock' },
    { k: 'door', at: { x: 20, y: 4 }, dir: 'n', to: 'dvg_int_mine1', arrive: { x: 20, y: 19 }, facing: 'n' },
    /** The cart road's mouth: boarded inside until Dvalinn opens it. */
    { k: 'door', at: { x: 31, y: 4 }, dir: 'n', to: 'dvg_int_tunnel', arrive: { x: 2, y: 9 }, facing: 's' },
    { k: 'enemy', id: 'jarnvordr', at: { x: 30, y: 14 } },
  ],
  /** Where Dvergagröf's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 8, y: 12 },
    { x: 28, y: 16 },
    { x: 15, y: 12 },
  ],
  map: [
    '##########····##########################',
    '##########····##########################',
    '##########····##########################',
    '##########····##########################',
    '##########····######V##########V########',
    '#########··········,······#####·########',
    '#··················,················K··#',
    '#··········,,,,,,,,,···················#',
    '#··················,····················',
    '#····K·············,,,,,,,,,,,,,,,,,,,,,',
    '#··················,····················',
    '#··················,····················',
    '#··················,···················#',
    '#··················,···················#',
    '#··················,···················#',
    '#······K···········,·····K·············#',
    '#··················,···················#',
    '#####··············,··············K····#',
    '#####·········K····,···················#',
    '#####··············,··········##########',
    '#####··············,··········##########',
    '##################·,··##################',
  ],
};
