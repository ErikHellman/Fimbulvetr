import type { DialogueDef } from '@core/story/dialogue';

/** Sindri the smith (M8a): forges for ore, and takes Embla's sail-needle for his bellows (trading step 6). */
export const SINDRI: DialogueDef = {
  entry: [
    { when: { k: 'item', id: 'trade_needle' }, node: 'needle' },
    { when: { k: 'flag', id: 'st_thane_ivaldi' }, node: 'free' },
    { when: { k: 'flag', id: 'st_d6_belgr' }, node: 'heart' },
    { node: 'forge' },
  ],
  nodes: {
    heart: {
      text: {
        en: 'Belgr’s iron heart, still warm. Now there is iron worth the forging. Sixteen ore, and the blade is yours.',
        sv: 'Belgrs järnhjärta, fortfarande varmt. Nu finns det järn värt att smida. Sexton malm, och klingan är din.',
      },
    },
    free: {
      text: {
        en: 'Ívaldi was my king before he was the Rime King’s anvil. I will not weep for him. But I will light his forge again, when the heat has gone out of it.',
        sv: 'Ívaldi var min kung innan han blev Rimkungens städ. Jag tänker inte gråta för honom. Men jag tänder hans smedja igen, när hettan har gått ur den.',
      },
    },
    forge: {
      text: {
        en: 'Silver is for the soft folk. Ore, long-legs. Bring me ore and I will forge you a byrnie that drinks heat, and a blade, if you can find me iron with a heart in it.',
        sv: 'Silver är för det veka folket. Malm, långben. Ge mig malm så smider jag en brynja som dricker hetta, och en klinga, om du kan hitta järn med ett hjärta i.',
      },
    },
    needle: {
      text: {
        en: 'A sail-needle! Bone, and true. My bellows have wheezed since spring. Here, take this lens. Dwarf-glass: for whoever watches the frost on the high road.',
        sv: 'En segelnål! Av ben, och rak. Min blåsbälg har väst sedan våren. Här, ta den här linsen. Dvärgglas: åt den som vaktar frosten på höga vägen.',
      },
      do: [
        { k: 'take', item: 'trade_needle' },
        { k: 'give', item: 'trade_lens' },
        { k: 'set', flag: 'q_trade', value: 6 },
        { k: 'sfx', id: 'sfx_bellows' },
      ],
    },
  },
};
