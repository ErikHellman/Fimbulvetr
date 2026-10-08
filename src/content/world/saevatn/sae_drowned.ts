import type { ScreenDef } from '@core/world/screen';

export const saeDrowned: ScreenDef = {
  id: 'sae_drowned',
  region: 'saevatn',
  purpose:
    'The drowned village: roof ridges and wall-tops standing out of the lake round an islet, where a stone spire rises from the water. Sökkva Hof lies under it: a dive at the ripple east of the islet (20, 9) goes down into it (in winter, once Eldr has melted a hole in the ice).',
  things: [
    {
      k: 'door',
      at: { x: 20, y: 9 },
      dir: 's',
      to: 'd5_r01',
      arrive: { x: 19, y: 13 },
      facing: 'n',
      dive: true,
    },
    {
      k: 'sign',
      at: { x: 14, y: 9 },
      text: {
        en: 'The spire’s stone is carved with waves, and the carving goes on down under the water.',
        sv: 'Spirans sten är huggen med vågor, och huggningen fortsätter ner under vattnet.',
      },
    },
    {
      k: 'chest',
      id: 'sae_c_drowned',
      at: { x: 27, y: 15 },
      sunk: true,
      gives: {
        silver: 40,
        text: {
          en: 'A drowned household’s hoard, still in its crock: 40 silver.',
          sv: 'Ett drunknat hushålls skatt, fortfarande i sin kruka: 40 silver.',
        },
      },
    },
  ],
  map: [
    '#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '#~~~RRR~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '#~~~RRR~~~~~~~~~~~~~~~~RRRR~~~~~~~~~~~~~',
    '#~~~~~~~~~~~~~~~~~~~~~~RRRR~~~~~~~~~~~~~',
    '#~~~~~~~~~~nnnnnnn~~~~~~~~~~~~~~~~~~~~~~',
    '#~~~~~~~~~nnnnnnnnn~~~~~~~~~~~~~~~~~~~~~',
    '#~~~~~~~~~nnynnnnnn~~~~~~~~~~~~RRR~~~~~~',
    '#~~~~~~~~~nnnnMnnnn~~~~~~~~~~~~RRR~~~~~~',
    '#~~~~~~~~~nnnnnnnnn~~~~~~~~~~~~~~~~~~~~~',
    '#~~~~~~~~~nnnnnnynn~~~~~~~~~~~~~~~~~~~~~',
    '#~~~~~~~~~nnnnnnnnn~~~~~~~~~~~~~~~~~~~~~',
    '#~~~~~~~~~~nnnnnnn~~~~~~~RR~~RR~~~~~~~~~',
    '#~~~~~~~~~~~~~~~~~~~~~~~~W~~~~W~~~~~~~~~',
    '#~~~RRR~~~~~~~~~~~~~~~~~~W~~~~W~~~~~~~~~',
    '#~~~RRR~~~~~~~~~~~~~~~~~~~W~~W~~~~~~~~~~',
    '#~~~~~~~~~~~~~~~~~~~~RRR~~~~~~~~~~~~~~~~',
    '#~~~~~~~~~~~~~~~~~~~~RRR~~~~~~~~~~~~~~~~',
    '#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  ],
};
