import type { DialogueDef } from '@core/story/dialogue';
import { daily, flag } from './util';

/** Ása, the old weaver, before the raid. */
const DAYS: DialogueDef = daily(
  [
    {
      en: 'My loom has more patience than my knees, dear.',
      sv: 'Min vävstol har mer tålamod än mina knän, kära du.',
    },
  ],
  [
    {
      en: 'Bjarni caught nothing but a boot. He says it is an omen. Of what, a barefoot fish?',
      sv: 'Bjarni fick inget annat än en stövel. Han säger att det är ett omen. För vad, en barfota fisk?',
    },
  ],
  [
    {
      en: 'My grandmother told of a winter that never ended. Silly story. Silly, silly story.',
      sv: 'Min farmor berättade om en vinter som aldrig tog slut. Dum historia. Dum, dum historia.',
    },
  ],
  { en: 'Oh, gods of the hearth…', sv: 'Åh, härdens gudar…' },
);

/** Ása: taken in the raid, held in a cell in Hrímturn until Hrímgerðr falls (M9b), then home at her loom. */
export const ASA: DialogueDef = {
  entry: [
    { when: flag('st_freed_asa'), node: 'home' },
    { when: flag('st_raid_done'), node: 'cell' },
    ...DAYS.entry,
  ],
  nodes: {
    ...DAYS.nodes,
    cell: {
      text: {
        en: 'Halvar’s lad, up here in the ice? Then the gods have not forgotten us. She makes me spin rime into thread, dear. My fingers have gone white.',
        sv: 'Halvars pojk, här uppe i isen? Då har gudarna inte glömt oss. Hon låter mig spinna rimfrost till tråd, kära du. Mina fingrar har vitnat.',
      },
      next: 'cell_where',
    },
    cell_where: {
      text: {
        en: 'Bjarni is in the next cell west, telling the walls about fish. The giantess keeps the bars bound with her own cold. While she stands, they hold.',
        sv: 'Bjarni sitter i nästa cell västerut och berättar om fisk för väggarna. Jättinnan håller gallren bundna med sin egen kyla. Så länge hon står, håller de.',
      },
    },
    home: {
      text: {
        en: 'Home, and my loom never looked so dear. I am weaving you a cloak, dear, with every one of us in the border. Silly old woman. Silly, happy old woman.',
        sv: 'Hemma, och min vävstol har aldrig sett så kär ut. Jag väver en mantel åt dig, kära du, med varenda en av oss i bården. Dum gammal kvinna. Dum, lycklig gammal kvinna.',
      },
    },
  },
};
