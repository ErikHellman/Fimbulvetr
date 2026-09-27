import type { DialogueDef } from '@core/story/dialogue';
import { evening, flag, not } from './util';

/** Skeggi the charcoal-burner never leaves his kiln. */
export const SKEGGI: DialogueDef = {
  entry: [
    { when: not(flag('n_skeggi_met')), node: 'meet' },
    { when: evening, node: 'night' },
    { node: 'day' },
  ],
  nodes: {
    meet: {
      text: {
        en: 'Mind the kiln, it bites. Skeggi. I burn charcoal for the smiths of Uppvík, when the road is open.',
        sv: 'Akta milan, den bits. Skeggi. Jag bränner kol åt smederna i Uppvík, när vägen är öppen.',
      },
      do: [{ k: 'set', flag: 'n_skeggi_met', value: true }],
      next: 'meet2',
    },
    meet2: {
      text: {
        en: 'It is not open. A pine as thick as a longhouse fell across it in the storm. Too big for one man and an axe.',
        sv: 'Den är inte öppen. En tall tjock som ett långhus föll över den i stormen. För stor för en karl med en yxa.',
      },
    },
    day: {
      text: {
        en: 'A kiln must breathe slow. Too much air and all you get is ash. Same with people, my mother said.',
        sv: 'En mila ska andas långsamt. För mycket luft och allt du får är aska. Samma sak med folk, sa min mor.',
      },
    },
    night: {
      text: {
        en: 'I watch the kiln all night. The smoke keeps the vargar off. The dead do not mind smoke.',
        sv: 'Jag vakar över milan hela natten. Röken håller vargarna borta. De döda bryr sig inte om rök.',
      },
    },
  },
};
