import type { ScreenDef } from '@core/world/screen';

export const dvgForgegate: ScreenDef = {
  id: 'dvg_forgegate',
  region: 'dvergagrof',
  purpose:
    "Ívaldi's Forge's great door, cut into the mountain's black face between two carved posts: the way into the third thane's hall (D6, M8b). The road comes in from the mine and up from the vents.",
  things: [
    {
      k: 'sign',
      at: { x: 16, y: 7 },
      w: 1,
      h: 1,
      text: {
        en: 'Cut in the post, in dwarf-runes: ÍVALDI’S FORGE. Under it, newer and rougher: KING OF NOTHING NOW.',
        sv: 'Inristat i stolpen, med dvärgrunor: ÍVALDES SMEDJA. Under det, nyare och grövre: KUNG ÖVER INGENTING NU.',
      },
    },
  ],
  /** Where Dvergagröf's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 8, y: 13 },
    { x: 33, y: 12 },
  ],
  map: [
    '########################################',
    '##########▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓##########',
    '##########▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓##########',
    '##########▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓##########',
    '#·········▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓##########',
    '#·········▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓·········#',
    '#·········▓▓▓▓▓▓▓▓▓VV▓▓▓▓▓▓▓▓▓·········#',
    '#···············M··,,··M···············#',
    '···················,,·············K····#',
    ',,,,,,,,,,,,,,,,,,,,,··················#',
    '···················,,··················#',
    '···················,,··················#',
    '#··················,,··················#',
    '#··················,,··················#',
    '#··················,,···············K··#',
    '#····K·············,,··················#',
    '#··················,,··················#',
    '#···········K······,,··················#',
    '#··················,,,,,,,,,,,·········#',
    '#··················,,········,·········#',
    '#··················,,········,·········#',
    '############################·,··########',
  ],
};
