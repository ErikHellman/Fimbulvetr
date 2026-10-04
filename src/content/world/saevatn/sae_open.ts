import type { ScreenDef } from '@core/world/screen';

export const saeOpen: ScreenDef = {
  id: 'sae_open',
  region: 'saevatn',
  purpose:
    'The open lake between the landing and Holmr: grey water to every side and two bare islets. In winter it is one white floor.',
  things: [
    /** A nykr foal circles here, out of the ice's way (it is under it in winter). */
    {
      k: 'enemy',
      id: 'nykr_foal',
      at: { x: 14, y: 12 },
      when: { k: 'not', c: { k: 'season', is: 'winter' } },
    },
    {
      k: 'chest',
      id: 'sae_c_open',
      at: { x: 20, y: 8 },
      sunk: true,
      gives: {
        silver: 30,
        text: {
          en: 'An iron-bound box from some lost cargo: 30 silver.',
          sv: 'Ett järnbeslaget skrin ur någon förlorad last: 30 silver.',
        },
      },
    },
  ],
  map: [
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#~~~~~~',
    '~~~~~~~~#nnn#~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~nnKnn~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~nnnnn~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~nnnn#~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~##nnnn~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~nnnKnn~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~nnnnnn~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~nnnnn#~~~~~~~~',
    '~~~~~~~~~~~~~~~~~##~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#',
  ],
};
