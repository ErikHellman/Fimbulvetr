import type { DialogueDef } from '@core/story/dialogue';
import { daily, flag } from './util';

/** Bjarni, the fisher, on his jetty, before the raid. */
const DAYS: DialogueDef = daily(
  [
    {
      en: 'The fish have gone deep. Too deep for late summer.',
      sv: 'Fisken har gått djupt. För djupt för sensommar.',
    },
  ],
  [
    {
      en: 'Caught a boot. Good boot, mind you. Just not a fish.',
      sv: 'Fick en stövel. En bra stövel, ska du veta. Bara inte en fisk.',
    },
  ],
  [{ en: 'Ice on the reeds this morning. Ice!', sv: 'Is på vassen i morse. Is!' }],
  { en: 'Get away from the water, lad!', sv: 'Håll dig borta från vattnet, pojk!' },
);

/** Bjarni: taken in the raid, held in a cell in Hrímturn until Hrímgerðr falls (M9b), then home at the brook. */
export const BJARNI: DialogueDef = {
  entry: [
    { when: flag('st_freed_bjarni'), node: 'home' },
    { when: flag('st_raid_done'), node: 'cell' },
    ...DAYS.entry,
  ],
  nodes: {
    ...DAYS.nodes,
    cell: {
      text: {
        en: 'Lad! I told them. Ice on the reeds, I said. Nobody listens to a fisher. Now look at us: frozen into a tower like pike in a pond.',
        sv: 'Pojk! Jag sa ju det. Is på vassen, sa jag. Ingen lyssnar på en fiskare. Se på oss nu: infrusna i ett torn som gäddor i en damm.',
      },
      next: 'cell_where',
    },
    cell_where: {
      text: {
        en: 'Ása is east of me, still spinning. The giantess sits at the top and looks through the walls. Watch her hands, lad. When they shine, something is coming.',
        sv: 'Ása sitter öster om mig och spinner fortfarande. Jättinnan sitter högst upp och ser genom väggarna. Se på hennes händer, pojk. När de lyser är något på väg.',
      },
    },
    home: {
      text: {
        en: 'The fish came back up when the ice went off the reeds. I caught three, and not a single boot. That is how I knew you had done it.',
        sv: 'Fisken kom upp igen när isen släppte vassen. Jag fick tre, och inte en enda stövel. Det var så jag visste att du hade klarat det.',
      },
    },
  },
};
