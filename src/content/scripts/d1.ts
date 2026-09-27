import type { ScriptDef } from '@core/story/script';

/** The first steps into Rótarhellir. */
const d1Enter: ScriptDef = {
  steps: [
    { k: 'do', effects: [{ k: 'set', flag: 'st_d1_entered', value: true }] },
    {
      k: 'say',
      who: 'ask',
      text: {
        en: 'Roots everywhere, thick as a man. And something down here is breathing.',
        sv: 'Rötter överallt, tjocka som en karl. Och något här nere andas.',
      },
    },
  ],
};

/**
 * Rótvættr is dead: Ask lights the first runestone. Far away Kolbeinn feels it; Ask walks back out under
 * the roots, and M1 ends.
 */
const stone1Light: ScriptDef = {
  steps: [
    {
      k: 'do',
      effects: [
        { k: 'set', flag: 'st_stone1_lit', value: true },
        { k: 'sfx', id: 'sfx_secret' },
      ],
    },
    {
      k: 'say',
      who: null,
      text: {
        en: 'Ask lays a hand on the stone. Cold blue fire runs along the serpent band, and the runes wake one by one.',
        sv: 'Ask lägger handen på stenen. Kall blå eld löper längs ormbandet, och runorna vaknar en efter en.',
      },
    },
    {
      k: 'say',
      who: null,
      text: {
        en: 'Far to the north, something vast turns over in its sleep.',
        sv: 'Långt i norr vänder sig något väldigt i sömnen.',
      },
    },
    { k: 'fade', out: true },
    {
      k: 'card',
      text: {
        en: 'On a frozen pass, Kolbeinn stops and looks south.',
        sv: 'På ett fruset pass stannar Kolbeinn och ser söderut.',
      },
    },
    {
      k: 'say',
      who: 'kolbeinn',
      text: {
        en: 'One stone. The farm boy has lit one stone. Let him come, then. The Rime King has room for one more.',
        sv: 'En sten. Bondpojken har tänt en sten. Låt honom komma, då. Rimkungen har plats för en till.',
      },
    },
    { k: 'warp', screen: 'myr_roots', at: { x: 19, y: 4 }, facing: 's' },
    { k: 'fade', out: false },
    { k: 'card', text: { en: 'To be continued.', sv: 'Fortsättning följer.' } },
  ],
};

export const D1_SCRIPTS: Readonly<Record<'d1_enter' | 'stone1_light', ScriptDef>> = {
  d1_enter: d1Enter,
  stone1_light: stone1Light,
};
