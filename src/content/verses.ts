import type { VerseDef } from '@core/world/mapModel';

/** Bragi's price for one verse, in silver. */
export const VERSE_PRICE = 30;

/**
 * The wandering skald's verses (M6a): each one, once bought, marks a secret on the pause map until its
 * heart piece is found. Three now; more are sung in later acts.
 */
export const VERSES: readonly VerseDef[] = [
  {
    flag: 'w_verse_deadwood',
    screen: 'nif_deadwood',
    piece: 'hp_nif_deadwood',
    text: {
      en: '“In the drowned wood where dead trees stand, a path runs under the mist. No foot finds it in the fog; only light lays it bare.”',
      sv: '”I den drunknade skogen där döda träd står går en stig under dimman. Ingen fot finner den i diset; bara ljus lägger den bar.”',
    },
  },
  {
    flag: 'w_verse_cairns',
    screen: 'nif_cairns',
    piece: 'hp_nif_cairns',
    text: {
      en: '“Among the sunken cairns a still pool keeps a heart. Water bears no one, until the frost lays a floor on it.”',
      sv: '”Bland de sjunkna rösena gömmer en stilla göl ett hjärta. Vatten bär ingen, förrän frosten lägger ett golv på det.”',
    },
  },
  {
    flag: 'w_verse_gjoll',
    screen: 'nif_gjoll',
    piece: 'hp_nif_gjoll',
    text: {
      en: '“By the Gjöll’s bones an island holds what the river kept. Feet cannot cross the black water; a chain can.”',
      sv: '”Vid Gjölls ben håller en holme det som floden behöll. Fötter tar sig inte över det svarta vattnet; en kedja kan.”',
    },
  },
];
