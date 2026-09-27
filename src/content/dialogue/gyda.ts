import type { DialogueDef } from '@core/story/dialogue';
import { afterRaid, all, daily, flag, not } from './util';

/** Gyða before the raid: one thought a day. */
const FARM_DAYS: DialogueDef = daily(
  [
    {
      en: 'The runestones on the ridge have gone dark, child. Stones do not tire.',
      sv: 'Runstenarna på åsen har slocknat, barn. Stenar blir inte trötta.',
    },
    {
      en: 'Go and look for yourself if you doubt an old woman.',
      sv: 'Gå och se själv om du tvivlar på en gammal kvinna.',
    },
  ],
  [
    {
      en: 'My grandmother kept the old oaths. I kept the records. Neither of us kept the stones lit.',
      sv: 'Min farmor höll de gamla eden. Jag höll förteckningarna. Ingen av oss höll stenarna tända.',
    },
  ],
  [
    {
      en: 'If a horn sounds tonight, come to the hof. Do not wait for daylight.',
      sv: 'Om ett horn ljuder i natt, kom till hovet. Vänta inte på dagsljuset.',
    },
  ],
  { en: 'It has begun. Go, child. Run.', sv: 'Det har börjat. Spring, barn. Spring.' },
);

/** Gyða, the goði, keeps the rune-records in the hof. The morning after the raid she tells the legend. */
export const GYDA: DialogueDef = {
  entry: [
    { when: all(afterRaid, not(flag('st_seax_given'))), node: 'first_halvar' },
    { when: all(afterRaid, not(flag('st_legend_told'))), node: 'legend' },
    { when: afterRaid, node: 'after' },
    ...FARM_DAYS.entry,
  ],
  nodes: {
    ...FARM_DAYS.nodes,
    first_halvar: {
      text: {
        en: 'You live. Good. Go to Halvar first, child. He has something that should be yours.',
        sv: 'Du lever. Bra. Gå till Halvar först, barn. Han har något som borde vara ditt.',
      },
    },
    legend: {
      text: {
        en: 'They came for the old blood, Ask. The blood of those who swore the binding.',
        sv: 'De kom efter det gamla blodet, Ask. Blodet efter dem som svor bindningen.',
      },
      next: 'legend2',
    },
    legend2: {
      text: {
        en: 'Long ago our people bound Hrímnir, the Rime King, under the mountains, and swore the oath on their bloodlines.',
        sv: 'För länge sedan band vårt folk Hrímnir, Rimkungen, under bergen, och svor eden på sina ättelinjer.',
      },
      next: 'legend3',
    },
    legend3: {
      text: {
        en: 'Three runestones keep the mountain pass shut. They have gone dark, and the binding is failing.',
        sv: 'Tre runstenar håller bergspasset stängt. De har slocknat, och bindningen håller på att brista.',
      },
      next: 'legend4',
    },
    legend4: {
      text: {
        en: 'Kolbeinn serves the Rime King now. Whatever he wants with our people, he needs them alive.',
        sv: 'Kolbeinn tjänar Rimkungen nu. Vad han än vill med vårt folk, så behöver han dem levande.',
      },
      next: 'legend5',
    },
    legend5: {
      text: {
        en: 'The first stone lies deep in Rótarhellir, the root cave in Myrkviðr. Light it again. Grímr will open the gate.',
        sv: 'Den första stenen ligger djupt i Rótarhellir, rotgrottan i Myrkviðr. Tänd den igen. Grímr öppnar porten.',
      },
      do: [
        { k: 'set', flag: 'st_legend_told', value: true },
        { k: 'policy', policy: 'cycling' },
      ],
      next: 'legend6',
    },
    legend6: {
      text: { en: 'Go, child. And come back.', sv: 'Gå nu, barn. Och kom tillbaka.' },
    },
    after: {
      text: {
        en: 'Rótarhellir lies where Yggdrasil’s roots break the forest floor, north and east of the old road.',
        sv: 'Rótarhellir ligger där Yggdrasils rötter bryter igenom skogsbotten, norr och öster om den gamla vägen.',
      },
    },
  },
};
