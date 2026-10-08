import type { ScreenDef } from '@core/world/screen';

export const saeLanding: ScreenDef = {
  id: 'sae_landing',
  region: 'saevatn',
  purpose:
    "Bárðr's far landing: a jetty out of the reeds onto a sandy spit under a rock knoll. The ferry puts in here, and in winter the ice starts here.",
  things: [
    /** A bauta-stone with one of the fallen huscarls' names (`q_record`, M11a). */
    {
      k: 'use',
      at: { x: 32, y: 10 },
      script: 'bauta_sae',
    },
    {
      k: 'use',
      at: { x: 15, y: 9 },
      h: 3,
      script: 'ferry_back',
    },
    {
      k: 'sign',
      at: { x: 25, y: 11 },
      text: {
        en: 'Cut into a driftwood post: a boat, a hand waving, and the number ten.',
        sv: 'Inristat i en drivvedsstolpe: en båt, en vinkande hand och talet tio.',
      },
    },
    {
      k: 'chest',
      id: 'sae_c_landing',
      at: { x: 8, y: 13 },
      sunk: true,
      gives: {
        silver: 20,
        text: {
          en: 'A ferryman’s purse, lost over the side long ago: 20 silver.',
          sv: 'En färjkarls pung, tappad överbord för länge sedan: 20 silver.',
        },
      },
    },
  ],
  /** Where Sævatn's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 30, y: 10 },
    { x: 27, y: 13 },
  ],
  map: [
    '#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#',
    '#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#',
    '#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#',
    '#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#####',
    '#~##~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#####',
    '#~#~~~~~~~~~~~~~~~~~~~~~yyyynnnyyyy#####',
    '#~~~~~~~~~~~~~~~~~~~~~~~ynnnnnnnnnn#####',
    '#~~~~~~~~~~~~~~~~~~~~~~~ynnn...B...#####',
    '#~~~~~~~~~~~~~~~~~~~~~~~ynnn.....K.#####',
    '#~~~~~~~~~~~~~~~~~~~~~~~ynnn......B#####',
    '#~~~~~~~~~~~~~~~JJJJJJJJJnnn....M..#####',
    '#~~~~~~~~~~~~~~~~~~~~~~~ynnn.......#####',
    '#~~~~~~~~~~~~~~~~~~~~~~~ynnn......K#####',
    '#~~~~~~~~~~~~~~~~~~~~~~~ynnn.......#####',
    '#~~~~~~~~~~~~~~~~~~~~~~~ynnnnnnnnnn#####',
    '#~~~~~~~~~~~~~~~~~~~~~~~yynnyyyyyyy#####',
    '#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#####',
    '#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~####',
    '#~~~~~~~~~~~~~ssssssssssssss~~~~~~~~~###',
    '#~~~~~~~~~~~~~ssssssssssssss~~~~~~~~~~~#',
    '#~~~~~~~~~~~~~ssssssssssssss~~~~~~~~~~~#',
    '~~~~~~~~~~~~~~ssssssssssssss~~~~~~~~~~~T',
  ],
};
