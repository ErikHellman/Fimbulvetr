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
    { when: flag('q_pages_done'), node: 'pages_done' },
    { when: { k: 'item', id: 'rune_leaf', gte: 4 }, node: 'pages' },
    { when: { k: 'item', id: 'rune_leaf' }, node: 'pages_some' },
    { when: flag('st_blood_told'), node: 'leaves' },
    { when: flag('st_home_winter'), node: 'blood' },
    { when: flag('st_uppvik_reached'), node: 'uppvik' },
    { when: flag('st_stone1_lit'), node: 'stone1' },
    { when: all(afterRaid, not(flag('st_seax_given'))), node: 'first_halvar' },
    { when: all(afterRaid, not(flag('st_legend_told'))), node: 'legend' },
    { when: afterRaid, node: 'after' },
    ...FARM_DAYS.entry,
  ],
  nodes: {
    uppvik: {
      text: {
        en: 'You have seen Uppvík! Is Gunnhildr still keeping the hof there? Tell her Gyða of Askdalr owes her a cheese.',
        sv: 'Du har sett Uppvík! Sköter Gunnhildr fortfarande hovet där? Säg att Gyða från Askdalr är skyldig henne en ost.',
      },
      next: 'uppvik2',
    },
    uppvik2: {
      text: {
        en: 'She will know what it means. We were girls together, before the winters grew teeth.',
        sv: 'Hon vet vad det betyder. Vi var flickor tillsammans, innan vintrarna fick tänder.',
      },
    },
    ...FARM_DAYS.nodes,
    stone1: {
      text: {
        en: 'One stone burns. I felt it in my old bones before the ravens brought the news. Two more, child, and Embla is still out there.',
        sv: 'En sten brinner. Jag kände det i mina gamla ben innan korparna kom med nyheten. Två till, barn, och Embla är fortfarande där ute.',
      },
    },
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
    blood: {
      text: {
        en: 'That was no winter, Ask. That was a breath, held for a thousand years and let go.',
        sv: 'Det där var ingen vinter, Ask. Det var en andedräkt, hållen i tusen år och utsläppt.',
      },
      next: 'blood2',
    },
    blood2: {
      text: {
        en: 'The old binding on the Rime King was sworn on blood, not on stone. Whose blood, my rune-record would say, but its last leaves were torn out when the raiders went through the hof.',
        sv: 'Den gamla bindningen av Rimkungen svors på blod, inte på sten. Vems blod skulle min runkrönika kunna säga, men dess sista blad revs ut när plundrarna drog genom hovet.',
      },
      do: [{ k: 'set', flag: 'st_blood_told', value: true }],
    },
    leaves: {
      text: {
        en: 'The lost leaves of my rune-record are out there somewhere, in the snow. If you come across them, bring them to me.',
        sv: 'De förlorade bladen ur min runkrönika finns någonstans där ute, i snön. Om du hittar dem, ge dem till mig.',
      },
      next: 'leaves2',
    },
    leaves2: {
      text: {
        en: 'Four leaves, one blown into each corner of the lowlands. The runes still call to each other: an eye watches one on our ridge, and the dark keeps one under a Haugar cairn.',
        sv: 'Fyra blad, ett blåst till vart hörn av låglandet. Runorna ropar fortfarande på varandra: ett öga vakar över ett på vår ås, och mörkret gömmer ett under ett röse i Haugar.',
      },
      next: 'leaves3',
    },
    leaves3: {
      text: {
        en: 'One lies in the drifts by the old mound in Myrkviðr, and one in Mýrland, behind stone that must be broken.',
        sv: 'Ett ligger i drivorna vid den gamla högen i Myrkviðr, och ett i Mýrland, bakom sten som måste brytas.',
      },
    },
    pages_some: {
      text: {
        en: 'A leaf! My own hand, from long ago. Find the others, child; one leaf of an oath is only a promise.',
        sv: 'Ett blad! Min egen hand, för länge sedan. Hitta de andra, barn; ett blad av en ed är bara ett löfte.',
      },
      next: 'leaves2',
    },
    pages: {
      text: {
        en: 'All four. Let me read… The jarl’s men swore the binding on their own blood: “for us, and for all who come after us.” The rest is smudged.',
        sv: 'Alla fyra. Låt mig läsa… Jarlens män svor bindningen på sitt eget blod: ”för oss, och för alla som kommer efter oss.” Resten är utsmetat.',
      },
      do: [
        { k: 'take', item: 'rune_leaf', n: 4 },
        { k: 'set', flag: 'q_pages_done', value: true },
      ],
      next: 'pages2',
    },
    pages2: {
      text: {
        en: 'Halvar stood among them, I would stake my life on it. Say nothing to him yet. Take this vessel; the runes are louder in the young.',
        sv: 'Halvar stod bland dem, det sätter jag mitt liv på. Säg ingenting till honom än. Ta det här kärlet; runorna ljuder högre i de unga.',
      },
      do: [
        { k: 'give', item: 'seidr_upgrade' },
        { k: 'sfx', id: 'sfx_itemget' },
      ],
    },
    pages_done: {
      text: {
        en: '“For all who come after us.” I have read those leaves a hundred times now, and that line does not get any warmer.',
        sv: '”För alla som kommer efter oss.” Jag har läst de bladen hundra gånger nu, och den raden blir inte varmare.',
      },
    },
  },
};
