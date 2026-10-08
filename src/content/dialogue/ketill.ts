import type { DialogueDef } from '@core/story/dialogue';
import { all, evening, flag, not } from './util';

/** Ketill the smith sells from his anvil: outside by day, inside when it rains. */
export const KETILL: DialogueDef = {
  entry: [
    { when: not(flag('n_ketill_met')), node: 'meet' },
    { when: all(flag('st_haugar_reached'), not(flag('n_styrr_met'))), node: 'styrr' },
    { when: flag('q_axes_done'), node: 'axes_after' },
    { when: all(flag('q_axes_asked'), not(evening)), node: 'axes_again' },
    { when: all(flag('st_pass_open'), not(evening)), node: 'axes' },
    { when: evening, node: 'night' },
    { when: { k: 'weather', is: ['rain', 'storm'] }, node: 'rain' },
    { node: 'day' },
  ],
  nodes: {
    axes: {
      text: {
        en: 'Nobody buys steel in this cold, so I throw it. Five straw men by the lower houses, six axes on the rack. Hit all five before the sand runs out, and I have a prize.',
        sv: 'Ingen köper stål i den här kylan, så jag kastar det. Fem halmgubbar vid de nedre husen, sex yxor i ställningen. Träffa alla fem innan sanden runnit ut, så har jag ett pris.',
      },
      do: [{ k: 'set', flag: 'q_axes_asked', value: true }],
      next: 'axes_how',
    },
    axes_how: {
      text: {
        en: 'Lift an axe, walk, and let it fly the way you are going. Forty-five heartbeats. Well?',
        sv: 'Lyft en yxa, gå, och låt den flyga åt det håll du går. Fyrtiofem hjärtslag. Nå?',
      },
      choices: [
        {
          text: { en: 'Throw the axes.', sv: 'Kasta yxorna.' },
          do: [{ k: 'set', flag: 'ev_axes_on', value: true }],
        },
        { text: { en: 'Not now.', sv: 'Inte nu.' } },
      ],
    },
    axes_again: {
      text: {
        en: 'The straw men are waiting. Another go at the axes?',
        sv: 'Halmgubbarna väntar. Ett nytt försök med yxorna?',
      },
      choices: [
        {
          text: { en: 'Throw the axes.', sv: 'Kasta yxorna.' },
          do: [{ k: 'set', flag: 'ev_axes_on', value: true }],
        },
        { text: { en: 'Not now.', sv: 'Inte nu.' } },
      ],
    },
    axes_after: {
      text: {
        en: 'I tell everyone a farmhand beat my range. Nobody believes me, so I tell them again.',
        sv: 'Jag berättar för alla att en dräng slog mitt kastrekord. Ingen tror mig, så jag berättar igen.',
      },
    },
    styrr: {
      text: {
        en: 'Haugar? Then look for Styrr. He was the old jarl’s best blade, and the worst customer I ever had. He can teach you more with a stick than I can sell you in steel.',
        sv: 'Haugar? Leta då upp Styrr. Han var den gamle jarlens bästa klinga, och den värsta kund jag någonsin haft. Han kan lära dig mer med en käpp än jag kan sälja dig i stål.',
      },
    },
    meet: {
      text: {
        en: 'Stand back from the sparks. Ketill. If it is iron and broken, I mend it. If it is silver, I take it.',
        sv: 'Stå undan från gnistorna. Ketill. Är det järn och trasigt så lagar jag det. Är det silver så tar jag det.',
      },
      do: [{ k: 'set', flag: 'n_ketill_met', value: true }],
      next: 'meet2',
    },
    meet2: {
      text: {
        en: 'That seax is a farm knife. An Uppvík sword bites deeper, and a byrnie takes the edge off a blow.',
        sv: 'Den där saxen är en gårdskniv. Ett Uppvíksvärd biter djupare, och en brynja tar udden av ett hugg.',
      },
    },
    day: {
      text: {
        en: 'Want something? Everything I sell is laid out on the anvil. Look, but mind the hot end.',
        sv: 'Vill du något? Allt jag säljer ligger på städet. Titta, men akta den heta änden.',
      },
    },
    rain: {
      text: {
        en: 'Rain puts a forge out if you let it. So I do not let it. The wares are on the anvil in here.',
        sv: 'Regnet släcker en ässja om man låter det. Så jag låter det inte. Varorna ligger på städet här inne.',
      },
    },
    night: {
      text: {
        en: 'No hammering after dark, Þórdís says. The anvil can wait. The mead cannot.',
        sv: 'Ingen hamring efter mörkrets inbrott, säger Þórdís. Städet kan vänta. Mjödet kan inte det.',
      },
    },
  },
};
