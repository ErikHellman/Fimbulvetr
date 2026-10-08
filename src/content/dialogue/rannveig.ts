import type { DialogueDef } from '@core/story/dialogue';
import { daily, flag } from './util';

/** Rannveig, the neighbour, before the raid. */
const DAYS: DialogueDef = daily(
  [
    {
      en: 'Do not mind Þorkell. He talks more to the goats than to me.',
      sv: 'Bry dig inte om Þorkell. Han pratar mer med getterna än med mig.',
    },
  ],
  [
    {
      en: 'A word of advice: never marry a man who names his goats.',
      sv: 'Ett råd: gift dig aldrig med en man som döper sina getter.',
    },
  ],
  [{ en: 'Bar your doors tonight, Ask. I mean it.', sv: 'Bomma dörrarna i natt, Ask. Jag menar allvar.' }],
  { en: 'Told him. I told him.', sv: 'Jag sa det till honom. Jag sa det.' },
);

/**
 * Rannveig: taken in the raid, held in a cell in Ívaldi's Forge until Ívaldi falls (M8b), then home,
 * where she sells arrows and bombs at her door (`shop_rannveig`): she filled the dwarves' powder-horns.
 */
export const RANNVEIG: DialogueDef = {
  entry: [
    { when: flag('st_freed_rannveig'), node: 'home' },
    { when: flag('st_raid_done'), node: 'cell' },
    ...DAYS.entry,
  ],
  nodes: {
    ...DAYS.nodes,
    cell: {
      text: {
        en: 'Ask? Thank the gods. They set me to filling powder-horns for the dwarves. Black powder, all day, by the lava. Is Þorkell alive?',
        sv: 'Ask? Gudarna vare tack. De satte mig att fylla kruthorn åt dvärgarna. Svartkrut, hela dagen, vid lavan. Lever Þorkell?',
      },
      next: 'cell_king',
    },
    cell_king: {
      text: {
        en: 'The king glows when he is angry. Water will not touch him then, they say, but frost might.',
        sv: 'Kungen glöder när han är arg. Vatten biter inte på honom då, säger de, men frost kanske.',
      },
    },
    home: {
      text: {
        en: 'I learned powder in that forge, so I may as well sell it. Arrows and bombs at my door, cheaper than Uppvík.',
        sv: 'Jag lärde mig krut i den smedjan, så jag kan lika gärna sälja det. Pilar och bomber vid min dörr, billigare än i Uppvík.',
      },
    },
  },
};
