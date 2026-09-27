import type { ScriptDef } from '@core/story/script';
import type { ScriptId } from '../ids';

const DAWN = 6 * 60;

/** Coming up the road to Uppvík's gate for the first time. */
const arrive: ScriptDef = {
  steps: [
    { k: 'do', effects: [{ k: 'set', flag: 'st_uppvik_reached', value: true }] },
    { k: 'card', text: { en: 'Uppvík, the trading town', sv: 'Uppvík, handelsstaden' } },
  ],
};

/** Knocking on the shut gate at night: the warden opens a crack and lets Ask through. */
const knock = (inside: boolean): ScriptDef => ({
  steps: [
    { k: 'do', effects: [{ k: 'sfx', id: 'sfx_door' }] },
    {
      k: 'say',
      who: null,
      text: inside
        ? {
            en: 'The warden lifts the bar with a grunt. “Out into that? Your funeral.”',
            sv: 'Vakten lyfter bommen med ett grymtande. ”Ut i det där? Din begravning.”',
          }
        : {
            en: 'A slat slides open. Eyes, a lantern, a sigh. “In, quick, before something follows you.”',
            sv: 'En lucka glider upp. Ögon, en lykta, en suck. ”In, fort, innan något följer efter dig.”',
          },
    },
    { k: 'fade', out: true },
    {
      k: 'warp',
      screen: 'upp_gate',
      at: inside ? { x: 19, y: 14 } : { x: 19, y: 10 },
      facing: inside ? 's' : 'n',
    },
    { k: 'fade', out: false },
  ],
});

/**
 * The mead hall's sleeping benches: after dark Ask sleeps to the morning; by day it is a rest. Either way
 * health comes back, and the slots are offered.
 */
const rest: ScriptDef = {
  steps: [
    {
      k: 'if',
      when: { k: 'phase', is: ['evening', 'night'] },
      then: [
        { k: 'fade', out: true },
        {
          k: 'do',
          effects: [
            { k: 'sleep', until: DAWN },
            { k: 'heal', n: 0 },
          ],
        },
        { k: 'fade', out: false },
        {
          k: 'say',
          who: null,
          text: {
            en: 'You sleep among snoring strangers and wake to porridge and smoke.',
            sv: 'Du sover bland snarkande främlingar och vaknar till gröt och rök.',
          },
        },
      ],
      else: [
        { k: 'do', effects: [{ k: 'heal', n: 0 }] },
        {
          k: 'say',
          who: null,
          text: {
            en: 'You rest a while on the bench. The hall hums around you.',
            sv: 'Du vilar en stund på bänken. Hallen sorlar omkring dig.',
          },
        },
      ],
    },
    { k: 'save' },
  ],
};

/** Hrafnkell across his counter, and Ketill at his anvil: a word, then the wares. */
const shopHrafnkell: ScriptDef = {
  steps: [
    { k: 'talk', dialogue: 'hrafnkell', with: 'hrafnkell' },
    { k: 'shop', id: 'hrafnkell' },
  ],
};

const shopKetill: ScriptDef = {
  steps: [
    { k: 'talk', dialogue: 'ketill', with: 'ketill' },
    { k: 'shop', id: 'ketill' },
  ],
};

export const UPPVIK_SCRIPTS: Readonly<Partial<Record<ScriptId, ScriptDef>>> = {
  uppvik_arrive: arrive,
  shop_hrafnkell: shopHrafnkell,
  shop_ketill: shopKetill,
  upp_knock_in: knock(false),
  upp_knock_out: knock(true),
  meadhall_rest: rest,
};
