import type { DialogueDef } from '@core/story/dialogue';
import { all, evening, flag, not } from './util';

/** Skeggi the charcoal-burner never leaves his kiln. */
export const SKEGGI: DialogueDef = {
  entry: [
    {
      when: all(flag('q_eldr_asked'), not(flag('st_eldr_learned')), not({ k: 'item', id: 'charred_stave' })),
      node: 'stave',
    },
    { when: { k: 'item', id: 'charred_stave' }, node: 'carry' },
    { when: not(flag('n_skeggi_met')), node: 'meet' },
    { when: flag('st_eldr_learned'), node: 'eldr' },
    { when: evening, node: 'night' },
    { node: 'day' },
  ],
  nodes: {
    stave: {
      text: {
        en: 'A charred stave? For Sölvi? He wants one every few winters. Here, burnt slow and black to the core.',
        sv: 'En förkolnad stav? Åt Sölvi? Han vill ha en med några vintrars mellanrum. Här, långsamt bränd och svart ända in.',
      },
      do: [
        { k: 'set', flag: 'n_skeggi_met', value: true },
        { k: 'give', item: 'charred_stave' },
      ],
      next: 'stave2',
    },
    stave2: {
      text: {
        en: 'Tell him he owes me a rune for the kiln door. One that keeps the vargar honest.',
        sv: 'Säg att han är skyldig mig en runa till milans lucka. En som håller vargarna ärliga.',
      },
    },
    carry: {
      text: {
        en: 'Get that stave to Sölvi before it crumbles. Charcoal does not keep like grudges do.',
        sv: 'Få staven till Sölvi innan den smulas sönder. Kol håller sig inte som agg gör.',
      },
    },
    eldr: {
      text: {
        en: 'Sölvi taught you the fire-song? Then keep it well away from my kiln.',
        sv: 'Lärde Sölvi dig eldsången? Håll den i så fall långt borta från min mila.',
      },
    },
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
