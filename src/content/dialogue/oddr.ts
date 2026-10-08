import type { DialogueDef } from '@core/story/dialogue';
import { daily, flag } from './util';

/** Oddr, who is sure there are trolls, before the raid. */
const DAYS: DialogueDef = daily(
  [{ en: 'Trolls live under the ford! Tófa is lying.', sv: 'Troll bor under vadet! Tófa ljuger.' }],
  [
    {
      en: 'They come out at night. That is why you never see them. Obviously.',
      sv: 'De kommer fram på natten. Det är därför man aldrig ser dem. Självklart.',
    },
  ],
  [
    {
      en: 'The ravens know something. Ravens always know something.',
      sv: 'Korparna vet något. Korpar vet alltid något.',
    },
  ],
  { en: 'I told you. I told you!', sv: 'Jag sa ju det. Jag sa ju det!' },
);

/**
 * Oddr: taken in the raid, held in a cell in Sökkva Hof until Nykr falls, then home to the field, where he
 * has laid a skiff at Bárðr's landing that rows to Sævatn's near landing.
 */
export const ODDR: DialogueDef = {
  entry: [
    { when: flag('st_freed_oddr'), node: 'home' },
    { when: flag('st_raid_done'), node: 'cell' },
    ...DAYS.entry,
  ],
  nodes: {
    ...DAYS.nodes,
    cell: {
      text: {
        en: 'Ask! It is not trolls. It is a HORSE. A horse made of lake. It looks in at me every night.',
        sv: 'Ask! Det är inte troll. Det är en HÄST. En häst gjord av sjö. Den tittar in på mig varje natt.',
      },
      next: 'cell_where',
    },
    cell_where: {
      text: {
        en: 'Hallbera is in the cell past the eel’s hall. She keeps telling me to hush. I am hushing!',
        sv: 'Hallbera sitter i cellen bortom ålens sal. Hon säger hela tiden åt mig att tiga. Jag tiger ju!',
      },
    },
    home: {
      text: {
        en: 'I built a skiff while I waited for the horse to eat me. It is at Bárðr’s landing now. Take it any time the lake is open.',
        sv: 'Jag byggde en eka medan jag väntade på att hästen skulle äta upp mig. Den ligger vid Bárðrs brygga nu. Ta den när sjön är öppen.',
      },
    },
  },
};
