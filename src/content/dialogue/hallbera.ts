import type { DialogueDef } from '@core/story/dialogue';
import { daily, flag } from './util';

/** Hallbera, the brewer, before the raid. */
const DAYS: DialogueDef = daily(
  [
    {
      en: 'The mead has gone sour. Never once in thirty summers.',
      sv: 'Mjödet har surnat. Inte en enda gång på trettio somrar.',
    },
  ],
  [
    {
      en: 'Come back at harvest for the good ale. If there is a harvest.',
      sv: 'Kom tillbaka till skörden för det goda ölet. Om det blir någon skörd.',
    },
  ],
  [
    {
      en: 'My cellar was cold this morning. Cold as a grave.',
      sv: 'Min källare var kall i morse. Kall som en grav.',
    },
  ],
  { en: 'Bar the doors! Bar the doors!', sv: 'Bomma dörrarna! Bomma dörrarna!' },
);

/**
 * Hallbera: taken in the raid, held in a cell in Sökkva Hof until Nykr falls, then home to her house in the
 * village, brewing again: red mead at her door (`shop_hallbera`).
 */
export const HALLBERA: DialogueDef = {
  entry: [
    { when: flag('st_freed_hallbera'), node: 'home' },
    { when: flag('st_raid_done'), node: 'cell' },
    ...DAYS.entry,
  ],
  nodes: {
    ...DAYS.nodes,
    cell: {
      text: {
        en: 'Don’t gape, child, I am well enough. Damp to the bone, but well. They want my brewing for their feasts.',
        sv: 'Gapa inte, barn, jag mår bra nog. Fuktig ända in i benen, men bra. De vill ha mitt bryggande till sina gästabud.',
      },
      next: 'cell_horse',
    },
    cell_horse: {
      text: {
        en: 'The thane in the pool keeps the keys. Kill the horse and the chains will fall. And tell Oddr to hush.',
        sv: 'Hövdingen i dammen har nycklarna. Döda hästen så faller kedjorna. Och säg åt Oddr att tiga.',
      },
    },
    home: {
      text: {
        en: 'My cellar is cold, and mead keeps well in the cold. Red mead again, twenty silver a horn, and I fill it myself.',
        sv: 'Min källare är kall, och mjöd håller sig bra i kylan. Rött mjöd igen, tjugo silver hornet, och jag fyller det själv.',
      },
    },
  },
};
