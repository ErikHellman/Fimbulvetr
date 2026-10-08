import type { DialogueDef } from '@core/story/dialogue';
import { flag } from './util';

/** Ormr the beacon-keeper (M9a), in his hut under the dark beacon: trading step 7, the beacon arm-ring. */
export const ORMR: DialogueDef = {
  entry: [
    { when: { k: 'item', id: 'trade_lens' }, node: 'lens' },
    { when: flag('st_thane_hrimgerdr'), node: 'free' },
    { when: flag('st_beacon_lit'), node: 'lit' },
    { node: 'dark' },
  ],
  nodes: {
    dark: {
      text: {
        en: 'A lowlander, up here, and not frozen stiff? Sit by the fire. My beacon has been dark since the first frost cracked its lens, and there is no glass in all the north to mend it.',
        sv: 'En lågländing, häruppe, och inte stelfrusen? Sätt dig vid elden. Min vårdkase har varit mörk sedan första frosten sprack linsen, och det finns inget glas i hela norden att laga den med.',
      },
    },
    lens: {
      text: {
        en: 'Dwarf-glass! Ground true, and not a bubble in it. Give it here. Forty winters I have kept that fire, and I thought I would die with it dark.',
        sv: 'Dvärgglas! Rätt slipat, och inte en bubbla i det. Ge hit. Fyrtio vintrar har jag hållit den elden, och jag trodde att jag skulle dö med den mörk.',
      },
      do: [
        { k: 'take', item: 'trade_lens' },
        { k: 'set', flag: 'st_beacon_lit', value: true },
        { k: 'set', flag: 'w_ring_beacon', value: true },
        { k: 'set', flag: 'q_trade', value: 7 },
        { k: 'sfx', id: 'sfx_itemget' },
      ],
      next: 'lens2',
    },
    lens2: {
      text: {
        en: 'There: it burns. Take my arm-ring. It was my grandfather’s, the first keeper. Whoever wears it sees what the land hides, as the beacon sees the valleys.',
        sv: 'Så: den brinner. Ta min armring. Den var min farfars, den förste väktarens. Den som bär den ser vad landet gömmer, som vårdkasen ser dalarna.',
      },
      next: 'lens3',
    },
    lens3: {
      text: {
        en: '(The beacon arm-ring: the map marks every heart piece still out in the world. Wear it from the pause menu.)',
        sv: '(Fyrarmringen: kartan visar varje hjärtbit som fortfarande ligger ute i världen. Bär den från pausmenyn.)',
      },
    },
    lit: {
      text: {
        en: 'See it? Every valley from here to the sea can see it too. Let the giants know someone is still watching.',
        sv: 'Ser du den? Varje dal härifrån till havet kan se den också. Låt jättarna veta att någon fortfarande vakar.',
      },
    },
    free: {
      text: {
        en: 'The tower stopped singing in the night. I have never heard the mountain so quiet. Only the King is left now, lowlander, and he is not asleep.',
        sv: 'Tornet slutade sjunga i natt. Jag har aldrig hört berget så tyst. Bara Kungen är kvar nu, lågländing, och han sover inte.',
      },
    },
  },
};
