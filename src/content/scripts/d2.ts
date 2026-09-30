import type { ScriptDef } from '@core/story/script';

/** The first steps into Sökkva Kvern. */
const d2Enter: ScriptDef = {
  steps: [
    { k: 'do', effects: [{ k: 'set', flag: 'st_d2_entered', value: true }] },
    {
      k: 'say',
      who: 'ask',
      text: {
        en: 'The mill’s insides, drowned and dripping. Wheels on the landing: they must let the water in and out.',
        sv: 'Kvarnens inre, dränkt och droppande. Hjul på avsatsen: de måste släppa in och ut vattnet.',
      },
    },
  ],
};

/**
 * Lindormr is dead: Ask lights the second runestone. Kolbeinn reports to his king; Ask comes up out of
 * the mill by the millpond, and M3 ends.
 */
const stone2Light: ScriptDef = {
  steps: [
    {
      k: 'do',
      effects: [
        { k: 'set', flag: 'st_stone2_lit', value: true },
        { k: 'sfx', id: 'sfx_secret' },
      ],
    },
    {
      k: 'say',
      who: null,
      text: {
        en: 'Ask lays a hand on the stone. The runes drink the black water off it and burn a cold blue.',
        sv: 'Ask lägger handen på stenen. Runorna dricker det svarta vattnet av den och brinner kallt blå.',
      },
    },
    {
      k: 'say',
      who: null,
      text: {
        en: 'Two stones awake. Far to the north, the ice groans.',
        sv: 'Två stenar vakna. Långt i norr stönar isen.',
      },
    },
    { k: 'fade', out: true },
    {
      k: 'card',
      text: {
        en: 'In a hall of ice, Kolbeinn kneels before an empty throne.',
        sv: 'I en sal av is knäböjer Kolbeinn inför en tom tron.',
      },
    },
    {
      k: 'say',
      who: 'kolbeinn',
      text: {
        en: 'Two stones, my king. The farm boy is quicker than the thaw. Keep the pass shut a while longer.',
        sv: 'Två stenar, min konung. Bondpojken är snabbare än tövädret. Håll passet stängt en tid till.',
      },
    },
    { k: 'warp', screen: 'myl_mill', at: { x: 18, y: 16 }, facing: 's' },
    { k: 'fade', out: false },
    { k: 'card', text: { en: 'To be continued.', sv: 'Fortsättning följer.' } },
  ],
};

export const D2_SCRIPTS: Readonly<Record<'d2_enter' | 'stone2_light', ScriptDef>> = {
  d2_enter: d2Enter,
  stone2_light: stone2Light,
};
